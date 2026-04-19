import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@sportnexus/db'
import { requireAuth } from '../plugins/auth'
import { ConflictError, ForbiddenError, NotFoundError } from '../errors'

const createEnrollmentSchema = z.object({
  slotId: z.string().min(1),
  transportOpted: z.boolean().default(false),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupAddress: z.string().optional(),
  pickupDistance: z.number().optional(),
  durationMonths: z.number().int().min(1).max(12).default(1),
})

const listQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
})

export default async function enrollmentRoutes(fastify: FastifyInstance) {
  // POST /api/enrollments
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const body = createEnrollmentSchema.parse(request.body)

    const enrollment = await prisma.$transaction(async (tx) => {
      // Lock the slot row and check capacity
      const slot = await tx.slot.findUnique({ where: { id: body.slotId } })
      if (!slot) throw new NotFoundError('Slot')
      if (!slot.isActive) throw new ConflictError('This slot is no longer available', 'SLOT_INACTIVE')
      if (slot.enrolledCount >= slot.totalCapacity) {
        throw new ConflictError('This slot has reached maximum capacity', 'SLOT_FULL')
      }

      // Check for duplicate enrollment
      const existing = await tx.enrollment.findUnique({
        where: { userId_slotId: { userId, slotId: body.slotId } },
      })
      if (existing) {
        throw new ConflictError('You are already enrolled in this slot', 'DUPLICATE_ENROLLMENT')
      }

      // Create enrollment
      const newEnrollment = await tx.enrollment.create({
        data: {
          userId,
          slotId: body.slotId,
          transportOpted: body.transportOpted,
          pickupLat: body.pickupLat,
          pickupLng: body.pickupLng,
          pickupAddress: body.pickupAddress,
          pickupDistance: body.pickupDistance,
          durationMonths: body.durationMonths,
          status: 'PENDING',
        },
        include: {
          slot: {
            include: { program: { include: { academy: true } } },
          },
        },
      })

      // Increment enrolled count
      await tx.slot.update({
        where: { id: body.slotId },
        data: { enrolledCount: { increment: 1 } },
      })

      return newEnrollment
    })

    return reply.code(201).send({ success: true, data: enrollment })
  })

  // GET /api/enrollments/me
  fastify.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const query = listQuerySchema.parse(request.query)

    const enrollments = await prisma.enrollment.findMany({
      where: { userId, ...(query.status ? { status: query.status } : {}) },
      include: {
        slot: {
          include: {
            program: { include: { academy: { include: { photos: { where: { isPrimary: true }, take: 1 } } } } },
          },
        },
        payment: true,
        transitSessions: { orderBy: { date: 'desc' }, take: 1 },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return reply.send({ success: true, data: enrollments })
  })

  // GET /api/enrollments/:id
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = request.params as { id: string }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        slot: { include: { program: { include: { academy: true } } } },
        payment: true,
        transitSessions: { orderBy: { date: 'desc' }, take: 5 },
        user: { select: { id: true, name: true, phone: true } },
      },
    })

    if (!enrollment) throw new NotFoundError('Enrollment')
    if (enrollment.userId !== userId) throw new ForbiddenError()

    return reply.send({ success: true, data: enrollment })
  })

  // DELETE /api/enrollments/:id — cancel
  fastify.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = request.params as { id: string }

    await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({ where: { id } })
      if (!enrollment) throw new NotFoundError('Enrollment')
      if (enrollment.userId !== userId) throw new ForbiddenError()
      if (['CANCELLED', 'EXPIRED'].includes(enrollment.status)) {
        throw new ConflictError('Enrollment is already cancelled', 'ALREADY_CANCELLED')
      }

      await tx.enrollment.update({ where: { id }, data: { status: 'CANCELLED' } })
      await tx.slot.update({
        where: { id: enrollment.slotId },
        data: { enrolledCount: { decrement: 1 } },
      })
    })

    return reply.code(204).send()
  })
}
