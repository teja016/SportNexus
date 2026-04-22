import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@sportnexus/db'
import { requireAuth } from '../plugins/auth'
import { ForbiddenError, NotFoundError } from '../errors'

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

// ─── Nearest-neighbour route optimiser ───────────────────────────────────────
// Builds pickup order so the bus visits the farthest stop first and ends
// closest to the academy (reverse nearest-neighbour from academy).
function optimiseRoute(
  academy: { lat: number; lng: number },
  pickups: Array<{ enrollmentId: string; lat: number; lng: number }>
): Array<{ enrollmentId: string; stopOrder: number }> {
  if (pickups.length === 0) return []
  const remaining = [...pickups]
  const ordered: typeof pickups = []
  let current = academy

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(current, remaining[i])
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    }
    const [next] = remaining.splice(nearestIdx, 1)
    ordered.push(next)
    current = next
  }

  // Reverse: bus departs from the farthest stop first → arrives at academy last
  return ordered.reverse().map((p, i) => ({ enrollmentId: p.enrollmentId, stopOrder: i + 1 }))
}

// ─── UTC day window ───────────────────────────────────────────────────────────
function todayWindow() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return { today, tomorrow }
}

export default async function transitRoutes(fastify: FastifyInstance) {

  // ── POST /transit/generate-today ─────────────────────────────────────────
  // Creates one TransitSession per slot that has transport-opted CONFIRMED
  // enrollments today. Idempotent — safe to call multiple times.
  fastify.post('/generate-today', async (_request, reply) => {
    const { today, tomorrow } = todayWindow()

    // Find all slots that have ≥1 confirmed transport enrollment
    const enrollments = await prisma.enrollment.findMany({
      where: {
        status: 'CONFIRMED',
        transportOpted: true,
        slot: { isActive: true },
      },
      include: {
        slot: { include: { program: { include: { academy: true } } } },
      },
    })

    // Group by slotId
    const bySlot = new Map<string, typeof enrollments>()
    for (const e of enrollments) {
      const arr = bySlot.get(e.slotId) ?? []
      arr.push(e)
      bySlot.set(e.slotId, arr)
    }

    const results: string[] = []

    for (const [slotId, slotEnrollments] of bySlot) {
      const slot = slotEnrollments[0].slot
      const academy = slot.program.academy

      // Upsert the session for today
      const session = await prisma.transitSession.upsert({
        where: { slotId_date: { slotId, date: today } },
        update: {},
        create: {
          slotId,
          date: today,
          status: 'SCHEDULED',
        },
      })

      // Build optimised stop order
      const pickups = slotEnrollments
        .filter((e) => e.pickupLat && e.pickupLng)
        .map((e) => ({ enrollmentId: e.id, lat: e.pickupLat!, lng: e.pickupLng! }))

      // Enrollments without coordinates get appended at the end
      const noCoord = slotEnrollments.filter((e) => !e.pickupLat || !e.pickupLng)

      const ordered = optimiseRoute({ lat: academy.lat, lng: academy.lng }, pickups)
      const offset = ordered.length
      const allOrdered = [
        ...ordered,
        ...noCoord.map((e, i) => ({ enrollmentId: e.id, stopOrder: offset + i + 1 })),
      ]

      // Upsert passengers
      for (const { enrollmentId, stopOrder } of allOrdered) {
        await prisma.transitPassenger.upsert({
          where: { enrollmentId },
          update: { sessionId: session.id, stopOrder },
          create: { sessionId: session.id, enrollmentId, stopOrder, status: 'WAITING' },
        })
      }

      results.push(`slot:${slotId} → session:${session.id} (${allOrdered.length} passengers)`)
    }

    return reply.send({ success: true, data: { generated: results.length, details: results } })
  })

  // ── GET /transit/driver/today ─────────────────────────────────────────────
  fastify.get('/driver/today', { preHandler: requireAuth }, async (request, reply) => {
    const { id: driverUserId } = request.user as { id: string }
    const { today, tomorrow } = todayWindow()

    const sessions = await prisma.transitSession.findMany({
      where: { driverUserId, date: { gte: today, lt: tomorrow } },
      include: {
        slot: { include: { program: { include: { academy: true } } } },
        passengers: {
          orderBy: { stopOrder: 'asc' },
          include: {
            enrollment: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ success: true, data: sessions })
  })

  // ── GET /transit/today ────────────────────────────────────────────────────
  // User's transit session for today — finds via their TransitPassenger record
  fastify.get('/today', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { today, tomorrow } = todayWindow()

    const passenger = await prisma.transitPassenger.findFirst({
      where: {
        enrollment: { userId },
        session: { date: { gte: today, lt: tomorrow } },
      },
      include: {
        session: {
          include: {
            slot: { include: { program: { include: { academy: true } } } },
            passengers: {
              orderBy: { stopOrder: 'asc' },
              include: {
                enrollment: {
                  include: { user: { select: { id: true, name: true, phone: true } } },
                },
              },
            },
          },
        },
        enrollment: { include: { slot: true } },
      },
    })

    return reply.send({ success: true, data: passenger ?? null })
  })

  // ── GET /transit/:id ──────────────────────────────────────────────────────
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const session = await prisma.transitSession.findUnique({
      where: { id },
      include: {
        slot: { include: { program: { include: { academy: true } } } },
        passengers: {
          orderBy: { stopOrder: 'asc' },
          include: {
            enrollment: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
      },
    })

    if (!session) throw new NotFoundError('Transit session')
    return reply.send({ success: true, data: session })
  })

  // ── PATCH /transit/:id/passenger/:pid/status ──────────────────────────────
  fastify.patch('/:id/passenger/:pid/status', { preHandler: requireAuth }, async (request, reply) => {
    const { id, pid } = request.params as { id: string; pid: string }
    const { status } = z.object({
      status: z.enum(['WAITING', 'PICKED_UP', 'ABSENT']),
    }).parse(request.body)

    const passenger = await prisma.transitPassenger.update({
      where: { id: pid },
      data: {
        status,
        pickedUpAt: status === 'PICKED_UP' ? new Date() : null,
      },
    })

    // Broadcast to session room
    const io = (fastify as any).io
    if (io) {
      io.to(`transit:${id}`).emit('passenger-update', { passengerId: pid, status })
    }

    return reply.send({ success: true, data: passenger })
  })

  // ── PATCH /transit/:id/driver-status ─────────────────────────────────────
  fastify.patch('/:id/driver-status', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = z.object({
      status: z.enum(['SCHEDULED', 'DISPATCHED', 'ARRIVING', 'PICKED_UP', 'AT_ACADEMY', 'COMPLETED', 'CANCELLED_BY_USER']),
    }).parse(request.body)

    const session = await prisma.transitSession.update({
      where: { id },
      data: { status, ...(status === 'CANCELLED_BY_USER' ? { cancelledAt: new Date() } : {}) },
    })

    const io = (fastify as any).io
    if (io) {
      io.to(`transit:${id}`).emit('status-update', { status: session.status })
    }

    return reply.send({ success: true, data: session })
  })

  // ── PATCH /transit/:id/driver-location ───────────────────────────────────
  fastify.patch('/:id/driver-location', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { lat, lng, etaMinutes } = z.object({
      lat:        z.number(),
      lng:        z.number(),
      etaMinutes: z.number().int().optional(),
    }).parse(request.body)

    const session = await prisma.transitSession.update({
      where: { id },
      data: { driverLat: lat, driverLng: lng, ...(etaMinutes !== undefined ? { etaMinutes } : {}) },
    })

    const io = (fastify as any).io
    if (io) {
      io.to(`transit:${id}`).emit('location-update', { lat, lng, etaMinutes, status: session.status })
    }

    return reply.send({ success: true, data: session })
  })

  // ── POST /transit/:id/assign-driver ──────────────────────────────────────
  fastify.post('/:id/assign-driver', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { driverUserId, driverName, driverPhone, vehicleNumber } = z.object({
      driverUserId:  z.string().min(1),
      driverName:    z.string().min(1),
      driverPhone:   z.string().min(10),
      vehicleNumber: z.string().min(1),
    }).parse(request.body)

    const session = await prisma.transitSession.update({
      where: { id },
      data: { driverUserId, driverName, driverPhone, vehicleNumber },
    })

    return reply.send({ success: true, data: session })
  })

  // ── POST /transit/:id/cancel-today ───────────────────────────────────────
  fastify.post('/:id/cancel-today', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = request.params as { id: string }

    const passenger = await prisma.transitPassenger.findFirst({
      where: { sessionId: id, enrollment: { userId } },
    })
    if (!passenger) throw new ForbiddenError()

    await prisma.transitPassenger.update({
      where: { id: passenger.id },
      data: { status: 'ABSENT' },
    })

    return reply.send({ success: true, data: { cancelled: true } })
  })
}
