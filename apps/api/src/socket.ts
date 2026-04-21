import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import { prisma } from '@sportnexus/db'
import { redis } from './redis'
import { notificationQueue } from './workers/notificationWorker'

const LOCATION_TTL = 60 // seconds — reconnecting clients get last known position

const STATUS_NOTIFICATIONS: Record<string, string> = {
  DISPATCHED:        'driver_dispatched',
  ARRIVING:          'driver_arriving',
  PICKED_UP:         'ride_picked_up',
  AT_ACADEMY:        'ride_at_academy',
  COMPLETED:         'ride_completed',
  CANCELLED_BY_USER: 'ride_cancelled',
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`)

    // Driver or user joins transit room
    socket.on('join-transit', async ({ sessionId }: { sessionId: string }) => {
      socket.join(`transit:${sessionId}`)
      console.log(`[Socket.IO] ${socket.id} joined transit:${sessionId}`)

      // Replay last known location from Redis buffer so reconnecting clients catch up immediately
      try {
        const cached = await redis.get(`transit:loc:${sessionId}`)
        if (cached) {
          socket.emit('location-update', JSON.parse(cached))
        }
      } catch { /* non-fatal */ }
    })

    // Driver broadcasts GPS location every ~3s
    socket.on(
      'driver-location',
      async ({
        sessionId,
        lat,
        lng,
        eta,
        status,
      }: {
        sessionId: string
        lat: number
        lng: number
        eta: number
        status: string
      }) => {
        const payload = { lat, lng, eta, status, ts: Date.now() }

        // Buffer in Redis — clients that reconnect get the latest position immediately
        try {
          await redis.set(`transit:loc:${sessionId}`, JSON.stringify(payload), 'EX', LOCATION_TTL)
        } catch { /* non-fatal */ }

        // Persist to DB (debounce via Redis is handled client-side; we write every emit here)
        try {
          await prisma.transitSession.update({
            where: { id: sessionId },
            data: { driverLat: lat, driverLng: lng, etaMinutes: eta, status: status as any },
          })
        } catch (err) {
          console.error('[Socket.IO] Failed to persist transit location:', err)
        }

        io.to(`transit:${sessionId}`).emit('location-update', payload)
      }
    )

    // Driver (or system) updates transit status
    socket.on(
      'transit-status',
      async ({ sessionId, status }: { sessionId: string; status: string }) => {
        try {
          await prisma.transitSession.update({
            where: { id: sessionId },
            data: {
              status: status as any,
              ...(status === 'CANCELLED_BY_USER' ? { cancelledAt: new Date() } : {}),
            },
          })
        } catch (err) {
          console.error('[Socket.IO] Failed to update status:', err)
        }

        const payload = { status, timestamp: new Date().toISOString() }
        io.to(`transit:${sessionId}`).emit('status-update', payload)

        if (status === 'COMPLETED') {
          io.to(`transit:${sessionId}`).emit('session-completed', { sessionId })
        }

        // Send push notification for meaningful status transitions
        const notifType = STATUS_NOTIFICATIONS[status]
        if (notifType) {
          try {
            const session = await prisma.transitSession.findUnique({
              where: { id: sessionId },
              include: { enrollment: { include: { user: { select: { id: true, fcmToken: true } } } } },
            })
            if (session?.enrollment.user.fcmToken) {
              await notificationQueue.add(notifType, {
                userId:    session.enrollment.userId,
                type:      notifType,
                sessionId,
              })
            }
          } catch { /* non-fatal */ }
        }
      }
    )

    socket.on('leave-transit', ({ sessionId }: { sessionId: string }) => {
      socket.leave(`transit:${sessionId}`)
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
    })
  })

  return io
}
