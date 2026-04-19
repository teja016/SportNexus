import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { prisma } from '@sportnexus/db'
import { redis } from './redis'
import { initSocket } from './socket'
import { AppError } from './errors'
import { startNotificationWorker } from './workers/notificationWorker'
import { startDailyTransitWorker } from './workers/dailyTransitWorker'

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import academyRoutes from './routes/academies'
import programRoutes from './routes/programs'
import enrollmentRoutes from './routes/enrollments'
import paymentRoutes from './routes/payments'
import transitRoutes from './routes/transit'
import adminRoutes from './routes/admin'

const PORT = parseInt(process.env.PORT ?? '3000', 10)

async function bootstrap() {
  const fastify = Fastify({ logger: true })

  // ── CORS ──────────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  })

  // ── JWT ───────────────────────────────────────────────────────────────────
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars',
  })

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis,
    errorResponseBuilder: () => ({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.', statusCode: 429 },
    }),
  })

  // ── Global Error Handler ──────────────────────────────────────────────────
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message, statusCode: error.statusCode },
      })
    }

    // Zod validation errors
    if (error.name === 'ZodError') {
      return reply.code(422).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: (error as any).errors?.[0]?.message ?? 'Validation failed', statusCode: 422 },
      })
    }

    fastify.log.error(error)
    return reply.code(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', statusCode: 500 },
    })
  })

  // ── Routes ────────────────────────────────────────────────────────────────
  fastify.get('/api/health', async () => {
    let dbStatus = 'connected'
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      dbStatus = 'disconnected'
    }
    return {
      status: 'ok',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      services: { database: dbStatus, redis: redis.status === 'ready' ? 'connected' : 'disconnected' },
    }
  })

  fastify.register(authRoutes,       { prefix: '/api/auth' })
  fastify.register(userRoutes,       { prefix: '/api/users' })
  fastify.register(academyRoutes,    { prefix: '/api/academies' })
  fastify.register(programRoutes,    { prefix: '/api/programs' })
  fastify.register(enrollmentRoutes, { prefix: '/api/enrollments' })
  fastify.register(paymentRoutes,    { prefix: '/api/payments' })
  fastify.register(transitRoutes,    { prefix: '/api/transit' })
  fastify.register(adminRoutes,      { prefix: '/api/admin' })

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  initSocket(fastify.server)

  // ── Listen ────────────────────────────────────────────────────────────────
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  fastify.log.info(`SportNexus API listening on port ${PORT}`)

  // ── Start Workers (after server is up so crashes don't block HTTP) ────────
  try {
    const redisInfo = await redis.info('server')
    const match = redisInfo.match(/redis_version:(\d+)\./)
    const redisMajor = match ? parseInt(match[1], 10) : 0
    if (redisMajor < 5) {
      console.warn(`[Workers] Redis ${redisMajor}.x detected — BullMQ requires Redis 5+. Workers disabled. Run Docker Redis for full functionality.`)
    } else {
      startNotificationWorker()
      await startDailyTransitWorker()
    }
  } catch (err) {
    console.error('[Workers] Failed to start workers (non-fatal):', err)
  }
}

bootstrap().catch((err) => {
  console.error('Fatal error starting server:', err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception (non-fatal, server stays up):', err.message)
})

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection (non-fatal, server stays up):', reason)
})
