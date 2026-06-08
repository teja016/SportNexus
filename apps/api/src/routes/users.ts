import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@sportnexus/db'
import { requireAuth } from '../plugins/auth'
import { NotFoundError } from '../errors'

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  dob: z.string().datetime().optional(),
  profilePhoto: z.string().url().optional(),
  homeLat: z.number().optional(),
  homeLng: z.number().optional(),
  homeAddress: z.string().optional(),
  fcmToken: z.string().optional(),
})

export default async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users/me
  fastify.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.user as { id: string }
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundError('User')
    return reply.send({ success: true, data: user })
  })

  // PATCH /api/users/me
  fastify.patch('/me', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.user as { id: string }
    const body = updateMeSchema.parse(request.body)

    const user = await prisma.user.update({
      where: { id },
      data: body,
    })

    return reply.send({ success: true, data: user })
  })

  // GET /api/users/me/enrollments
  fastify.get('/me/enrollments', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.user as { id: string }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: id },
      include: {
        slot: {
          include: {
            program: {
              include: { academy: true },
            },
          },
        },
        payment: true,
        transitPassenger: {
          include: { session: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return reply.send({ success: true, data: enrollments })
  })
}
