import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@sportnexus/db'
import { calculateDistance } from '@sportnexus/utils'
import { getCache, setCache, deleteCache } from '../redis'
import { NotFoundError } from '../errors'
import crypto from 'crypto'

const listQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().default(25),
  sport: z.string().optional(),
  transport: z.coerce.boolean().optional(),
  rating: z.coerce.number().optional(),
  minFee: z.coerce.number().optional(),
  maxFee: z.coerce.number().optional(),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export default async function academyRoutes(fastify: FastifyInstance) {
  // GET /api/academies
  fastify.get('/', async (request, reply) => {
    const query = listQuerySchema.parse(request.query)

    const cacheKey = `academies:${crypto.createHash('md5').update(JSON.stringify(query)).digest('hex')}`
    const cached = await getCache(cacheKey)
    if (cached) return reply.send(cached)

    const where: any = {}
    if (query.sport) where.programs = { some: { sportType: query.sport } }
    if (query.transport !== undefined) where.transportAvailable = query.transport
    if (query.rating) where.rating = { gte: query.rating }
    if (query.search) where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ]

    let academies = await prisma.academy.findMany({
      where,
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        programs: {
          where: { isActive: true },
          select: { id: true, name: true, sportType: true, feeMonthly: true, ageGroupMin: true, ageGroupMax: true, durationMonths: true, description: true, isActive: true, createdAt: true },
        },
      },
      orderBy: { rating: 'desc' },
    })

    // Compute distances and apply radius filter
    if (query.lat !== undefined && query.lng !== undefined) {
      academies = academies
        .map((a) => ({ ...a, distance: calculateDistance(query.lat!, query.lng!, a.lat, a.lng) }))
        .filter((a) => (a as any).distance <= query.radius)
        .sort((a, b) => (a as any).distance - (b as any).distance)
    }

    // Cursor-based pagination
    let startIndex = 0
    if (query.cursor) {
      const idx = academies.findIndex((a) => a.id === query.cursor)
      if (idx !== -1) startIndex = idx + 1
    }

    const paginated = academies.slice(startIndex, startIndex + query.limit)
    const hasMore = startIndex + query.limit < academies.length
    const nextCursor = hasMore ? paginated[paginated.length - 1]?.id ?? null : null

    const response = {
      success: true,
      data: paginated,
      meta: { cursor: nextCursor, total: academies.length, hasMore, limit: query.limit },
    }

    await setCache(cacheKey, response, 300)
    return reply.send(response)
  })

  // GET /api/academies/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const cacheKey = `academy:${id}`
    const cached = await getCache(cacheKey)
    if (cached) return reply.send(cached)

    const academy = await prisma.academy.findUnique({
      where: { id },
      include: {
        photos: true,
        coaches: { where: { isActive: true } },
        programs: {
          where: { isActive: true },
          include: { slots: { where: { isActive: true } } },
        },
        transportRoutes: { where: { isActive: true } },
      },
    })

    if (!academy) throw new NotFoundError('Academy')

    const response = { success: true, data: academy }
    await setCache(cacheKey, response, 600)
    return reply.send(response)
  })

  // GET /api/academies/:id/programs
  fastify.get('/:id/programs', async (request, reply) => {
    const { id } = request.params as { id: string }

    const programs = await prisma.sportProgram.findMany({
      where: { academyId: id, isActive: true },
      include: {
        slots: { where: { isActive: true } },
        academy: { select: { id: true, name: true, transportAvailable: true } },
      },
    })

    return reply.send({ success: true, data: programs })
  })

  // POST /api/academies (Admin: create)
  fastify.post('/', async (request, reply) => {
    const body = request.body as any
    const academy = await prisma.academy.create({ data: body })
    await deleteCache('academies:*')
    return reply.code(201).send({ success: true, data: academy })
  })

  // PATCH /api/academies/:id (Admin: update)
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const academy = await prisma.academy.update({ where: { id }, data: request.body as any })
    await deleteCache('academies:*')
    await deleteCache(`academy:${id}`)
    return reply.send({ success: true, data: academy })
  })
}
