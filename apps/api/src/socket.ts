import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import { prisma } from '@sportnexus/db'

export function initSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`)

    // Driver or user joins transit room
    socket.on('join-transit', ({ sessionId }: { sessionId: string }) => {
      socket.join(`transit:${sessionId}`)
      console.log(`[Socket.IO] ${socket.id} joined transit:${sessionId}`)
    })

    // Driver broadcasts GPS location
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
        try {
          await prisma.transitSession.update({
            where: { id: sessionId },
            data: {
              driverLat: lat,
              driverLng: lng,
              etaMinutes: eta,
              status: status as any,
            },
          })
        } catch (err) {
          console.error('[Socket.IO] Failed to update transit session:', err)
        }

        io.to(`transit:${sessionId}`).emit('location-update', { lat, lng, eta, status })
      }
    )

    // Driver updates transit status
    socket.on(
      'transit-status',
      async ({ sessionId, status }: { sessionId: string; status: string }) => {
        try {
          await prisma.transitSession.update({
            where: { id: sessionId },
            data: { status: status as any },
          })
        } catch (err) {
          console.error('[Socket.IO] Failed to update status:', err)
        }

        io.to(`transit:${sessionId}`).emit('status-update', {
          status,
          timestamp: new Date().toISOString(),
        })

        if (status === 'COMPLETED') {
          io.to(`transit:${sessionId}`).emit('session-completed', { sessionId })
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
