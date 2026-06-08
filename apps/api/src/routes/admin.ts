import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, Prisma } from '@sportnexus/db'
import { requireRole } from '../plugins/auth'

const updateSlotSchema = z.object({
  totalCapacity: z.number().int().min(1).optional(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  daysOfWeek: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

const createAcademySchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  address: z.string(),
  city: z.string(),
  lat: z.number(),
  lng: z.number(),
  transportAvailable: z.boolean().default(false),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

const updateAcademySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  transportAvailable: z.boolean().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isVerified: z.boolean().optional(),
})

const adminGuard = requireRole(['ACADEMY_ADMIN', 'SUPER_ADMIN'])

function dayWindow() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return { today, tomorrow }
}

export default async function adminRoutes(fastify: FastifyInstance) {

  // ── GET /api/admin/dashboard ────────────────────────────────────────────────
  fastify.get('/dashboard', { preHandler: adminGuard }, async (request, reply) => {
    const authUser = request.user as { id: string; role: string }
    const isSuperAdmin = authUser.role === 'SUPER_ADMIN'

    let academyIds: string[] | undefined
    if (!isSuperAdmin) {
      const academies = await prisma.academy.findMany({
        where: { adminUserId: authUser.id },
        select: { id: true },
      })
      academyIds = academies.map((a) => a.id)
    }

    const enrollmentWhere = academyIds
      ? { slot: { program: { academyId: { in: academyIds } } } }
      : {}

    const { today, tomorrow } = dayWindow()

    const [
      totalEnrollments,
      todayEnrollments,
      activeSlots,
      payments,
      enrollmentsByStatus,
      totalAcademies,
      totalUsers,
      transportEnrollments,
    ] = await Promise.all([
      prisma.enrollment.count({ where: enrollmentWhere }),
      prisma.enrollment.count({
        where: { ...enrollmentWhere, enrolledAt: { gte: today, lt: tomorrow } },
      }),
      prisma.slot.count({
        where: {
          isActive: true,
          ...(academyIds ? { program: { academyId: { in: academyIds } } } : {}),
        },
      }),
      prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          ...(academyIds
            ? { enrollment: { slot: { program: { academyId: { in: academyIds } } } } }
            : {}),
        },
        select: { totalAmount: true, amount: true, transportFee: true, createdAt: true },
      }),
      prisma.enrollment.groupBy({
        by: ['status'],
        where: enrollmentWhere,
        _count: true,
      }),
      isSuperAdmin
        ? prisma.academy.count()
        : prisma.academy.count({ where: { adminUserId: authUser.id } }),
      isSuperAdmin
        ? prisma.user.count({ where: { role: 'USER' } })
        : Promise.resolve(0),
      prisma.enrollment.count({ where: { ...enrollmentWhere, transportOpted: true } }),
    ])

    const totalRevenue = payments.reduce((sum, p) => sum + p.totalAmount, 0)
    const totalTraining = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalTransport = payments.reduce((sum, p) => sum + p.transportFee, 0)

    const revenueByMonth: Record<string, number> = {}
    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 7)
      revenueByMonth[key] = (revenueByMonth[key] ?? 0) + p.totalAmount
    }

    const enrollmentsByStatusMap: Record<string, number> = {}
    for (const e of enrollmentsByStatus) {
      enrollmentsByStatusMap[e.status] = e._count
    }

    return reply.send({
      success: true,
      data: {
        totalEnrollments,
        todayEnrollments,
        activeSlots,
        totalRevenue,
        totalTraining,
        totalTransport,
        totalAcademies,
        totalUsers,
        transportEnrollments,
        enrollmentsByStatus: enrollmentsByStatusMap,
        revenueByMonth: Object.entries(revenueByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => ({ month, amount })),
      },
    })
  })

  // ── GET /api/admin/transit/today ────────────────────────────────────────────
  fastify.get('/transit/today', { preHandler: adminGuard }, async (request, reply) => {
    const authUser = request.user as { id: string; role: string }
    const { today, tomorrow } = dayWindow()

    let sessionWhere: any = { date: { gte: today, lt: tomorrow } }

    if (authUser.role !== 'SUPER_ADMIN') {
      const academies = await prisma.academy.findMany({
        where: { adminUserId: authUser.id },
        select: { id: true },
      })
      const ids = academies.map((a) => a.id)
      sessionWhere.slot = { program: { academyId: { in: ids } } }
    }

    const sessions = await prisma.transitSession.findMany({
      where: sessionWhere,
      include: {
        slot: {
          include: {
            program: { include: { academy: { select: { id: true, name: true } } } },
          },
        },
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

  // ── POST /api/admin/academies ───────────────────────────────────────────────
  fastify.post('/academies', { preHandler: adminGuard }, async (request, reply) => {
    const authUser = request.user as { id: string; role: string }
    const body = createAcademySchema.parse(request.body)
    const academy = await prisma.academy.create({
      data: { ...body, admin: { connect: { id: authUser.id } } } as Prisma.AcademyCreateInput,
    })
    return reply.code(201).send({ success: true, data: academy })
  })

  // ── PATCH /api/admin/academies/:id ─────────────────────────────────────────
  fastify.patch('/academies/:id', { preHandler: adminGuard }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateAcademySchema.parse(request.body)
    const academy = await prisma.academy.update({ where: { id }, data: body })
    return reply.send({ success: true, data: academy })
  })

  // ── PATCH /api/admin/slots/:id ─────────────────────────────────────────────
  fastify.patch('/slots/:id', { preHandler: adminGuard }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateSlotSchema.parse(request.body)
    const slot = await prisma.slot.update({ where: { id }, data: body })
    return reply.send({ success: true, data: slot })
  })

  // ── GET /api/admin/enrollments ─────────────────────────────────────────────
  fastify.get('/enrollments', { preHandler: adminGuard }, async (request, reply) => {
    const authUser = request.user as { id: string; role: string }

    let where: any = {}
    if (authUser.role !== 'SUPER_ADMIN') {
      const academies = await prisma.academy.findMany({
        where: { adminUserId: authUser.id },
        select: { id: true },
      })
      const ids = academies.map((a) => a.id)
      where = { slot: { program: { academyId: { in: ids } } } }
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        slot: {
          include: {
            program: { include: { academy: { select: { id: true, name: true } } } },
          },
        },
        payment: {
          select: {
            id: true,
            totalAmount: true,
            amount: true,
            transportFee: true,
            status: true,
            gatewayOrderId: true,
            gatewayTxnId: true,
            webhookVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 100,
    })

    return reply.send({ success: true, data: enrollments })
  })

  // ── GET /api/admin/revenue ─────────────────────────────────────────────────
  fastify.get('/revenue', { preHandler: adminGuard }, async (request, reply) => {
    const authUser = request.user as { id: string; role: string }

    let paymentWhere: any = { status: 'SUCCESS' }
    if (authUser.role !== 'SUPER_ADMIN') {
      const academies = await prisma.academy.findMany({
        where: { adminUserId: authUser.id },
        select: { id: true },
      })
      const ids = academies.map((a) => a.id)
      paymentWhere.enrollment = { slot: { program: { academyId: { in: ids } } } }
    }

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      select: { totalAmount: true, amount: true, transportFee: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const byMonth: Record<string, { training: number; transport: number; total: number }> = {}
    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 7)
      if (!byMonth[key]) byMonth[key] = { training: 0, transport: 0, total: 0 }
      byMonth[key].training += p.amount
      byMonth[key].transport += p.transportFee
      byMonth[key].total += p.totalAmount
    }

    const result = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))

    return reply.send({ success: true, data: result })
  })

  // ── GET /api/admin/users ───────────────────────────────────────────────────
  fastify.get('/users', { preHandler: adminGuard }, async (_request, reply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        fcmToken: true,
        homeAddress: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ success: true, data: users })
  })
}
