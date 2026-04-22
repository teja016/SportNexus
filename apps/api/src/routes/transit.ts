import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@sportnexus/db'
import { requireAuth } from '../plugins/auth'
import { ForbiddenError, NotFoundError, ConflictError } from '../errors'
import { notificationQueue } from '../workers/notificationWorker'

const createSessionSchema = z.object({
  enrollmentId: z.string().min(1),
  driverName: z.string().min(1),
  driverPhone: z.string().min(10),
  vehicleNumber: z.string().min(1),
})

const updateStatusSchema = z.object({
  status: z.enum([
    'SCHEDULED', 'DISPATCHED', 'ARRIVING', 'PICKED_UP',
    'AT_ACADEMY', 'COMPLETED', 'CANCELLED_BY_USER',
  ]),
})

export default async function transitRoutes(fastify: FastifyInstance) {
  // GET /api/transit/today
  fastify.get('/today', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const sessions = await prisma.transitSession.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        enrollment: { userId },
      },
      include: {
        enrollment: {
          include: {
            slot: { include: { program: { include: { academy: true } } } },
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ success: true, data: sessions })
  })

  // GET /api/transit/:id
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = request.params as { id: string }

    const session = await prisma.transitSession.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            slot: { include: { program: { include: { academy: true } } } },
          },
        },
      },
    })

    if (!session) throw new NotFoundError('Transit session')
    if (session.enrollment.userId !== userId) throw new ForbiddenError()

    return reply.send({ success: true, data: session })
  })

  // POST /api/transit/init-session — auto-create today's session for a transport enrollment
  fastify.post('/init-session', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { enrollmentId } = z.object({ enrollmentId: z.string().min(1) }).parse(request.body)

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { slot: true },
    })
    if (!enrollment) throw new NotFoundError('Enrollment')
    if (enrollment.userId !== userId) throw new ForbiddenError()

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const session = await prisma.transitSession.upsert({
      where: { enrollmentId_date: { enrollmentId, date: today } },
      update: {},
      create: { enrollmentId, date: today, status: 'SCHEDULED' },
    })

    return reply.code(201).send({ success: true, data: session })
  })

  // POST /api/transit — create session (operator)
  fastify.post('/', async (request, reply) => {
    const body = createSessionSchema.parse(request.body)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const session = await prisma.transitSession.upsert({
      where: { enrollmentId_date: { enrollmentId: body.enrollmentId, date: today } },
      update: {
        driverName: body.driverName,
        driverPhone: body.driverPhone,
        vehicleNumber: body.vehicleNumber,
      },
      create: {
        enrollmentId: body.enrollmentId,
        date: today,
        status: 'SCHEDULED',
        driverName: body.driverName,
        driverPhone: body.driverPhone,
        vehicleNumber: body.vehicleNumber,
      },
    })

    return reply.code(201).send({ success: true, data: session })
  })

  // PATCH /api/transit/:id/status — operator updates status
  fastify.patch('/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateStatusSchema.parse(request.body)

    const session = await prisma.transitSession.update({
      where: { id },
      data: {
        status: body.status,
        ...(body.status === 'CANCELLED_BY_USER' ? { cancelledAt: new Date() } : {}),
      },
    })

    return reply.send({ success: true, data: session })
  })

  // GET /api/transit/driver/today — sessions assigned to the logged-in driver
  fastify.get('/driver/today', { preHandler: requireAuth }, async (request, reply) => {
    const { id: driverUserId } = request.user as { id: string }
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const sessions = await prisma.transitSession.findMany({
      where: { driverUserId, date: { gte: today, lt: tomorrow } },
      include: {
        enrollment: {
          include: {
            user:  { select: { id: true, name: true, phone: true } },
            slot:  { include: { program: { include: { academy: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ success: true, data: sessions })
  })

  // PATCH /api/transit/:id/driver-location — driver pushes GPS coordinates
  fastify.patch('/:id/driver-location', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { lat, lng, etaMinutes } = z.object({
      lat:        z.number(),
      lng:        z.number(),
      etaMinutes: z.number().int().optional(),
    }).parse(request.body)

    const session = await prisma.transitSession.update({
      where: { id },
      data:  { driverLat: lat, driverLng: lng, ...(etaMinutes !== undefined ? { etaMinutes } : {}) },
    })

    // Broadcast to user's transit room
    const io = (fastify as any).io
    if (io) {
      io.to(`transit:${id}`).emit('location-update', { lat, lng, etaMinutes, status: session.status })
    }

    return reply.send({ success: true, data: session })
  })

  // PATCH /api/transit/:id/driver-status — driver updates session status
  fastify.patch('/:id/driver-status', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateStatusSchema.parse(request.body)

    const session = await prisma.transitSession.update({
      where: { id },
      data:  {
        status: body.status,
        ...(body.status === 'CANCELLED_BY_USER' ? { cancelledAt: new Date() } : {}),
      },
    })

    const io = (fastify as any).io
    if (io) {
      io.to(`transit:${id}`).emit('status-update', { status: session.status })
    }

    return reply.send({ success: true, data: session })
  })

  // POST /api/transit/:id/cancel-today — user cancels their transport for today
  fastify.post('/:id/cancel-today', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = request.params as { id: string }

    const session = await prisma.transitSession.findUnique({
      where: { id },
      include: {
        enrollment: { include: { user: { select: { id: true, fcmToken: true } } } },
      },
    })

    if (!session) throw new NotFoundError('Transit session')
    if (session.enrollment.userId !== userId) throw new ForbiddenError()

    if (['PICKED_UP', 'AT_ACADEMY', 'COMPLETED', 'CANCELLED_BY_USER'].includes(session.status)) {
      throw new ConflictError('Cannot cancel — transport already in progress or completed', 'CANNOT_CANCEL')
    }

    const updated = await prisma.transitSession.update({
      where: { id },
      data: { status: 'CANCELLED_BY_USER', cancelledAt: new Date() },
    })

    // Notify user of cancellation confirmation
    if (session.enrollment.user.fcmToken) {
      await notificationQueue.add('ride_cancelled', {
        userId:    userId,
        type:      'ride_cancelled',
        sessionId: id,
      }).catch(() => {/* non-fatal */})
    }

    return reply.send({ success: true, data: updated })
  })
}
