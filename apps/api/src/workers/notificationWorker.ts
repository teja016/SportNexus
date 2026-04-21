import { Worker, Queue } from 'bullmq'
import { redis } from '../redis'
import { prisma } from '@sportnexus/db'

export const notificationQueue = new Queue('notifications', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})
notificationQueue.on('error', (err) => {
  console.error('[Notifications] Queue error (non-fatal):', err.message)
})

const NOTIFICATION_MESSAGES: Record<string, { title: string; body: string }> = {
  // Time-scheduled (fired by dailyTransitWorker)
  slot_reminder:           { title: 'Training Reminder 🏆',   body: 'Your training session starts in 1 hour' },
  vehicle_arriving:        { title: 'Vehicle Coming Soon 🚌',  body: 'Your pickup vehicle will arrive in 30 minutes' },
  pickup_started:          { title: 'Vehicle Nearby 📍',       body: 'Your vehicle is almost at the pickup point' },
  in_transit:              { title: 'En Route 🛣️',             body: "You're on your way to the academy" },
  arrived:                 { title: 'Almost There! 🏫',        body: 'Arriving at the academy in 5 minutes' },
  return_vehicle_arriving: { title: 'Return Vehicle Ready 🚌', body: 'Your return vehicle is on its way home' },
  return_pickup:           { title: 'Return Pickup Started 🏠', body: 'Return pickup has started' },
  return_transit:          { title: 'Heading Home 🏡',          body: "You're on your way back home" },
  return_arrived:          { title: 'Home Safe ✅',             body: "You've reached home safely. See you tomorrow!" },
  // Status-triggered (fired by socket status changes)
  driver_dispatched:       { title: 'Driver Assigned 🚗',      body: 'Your driver has been assigned and is heading to you' },
  driver_arriving:         { title: 'Driver Arriving Soon 📍',  body: 'Your vehicle is almost at your pickup location' },
  ride_picked_up:          { title: "You're On Board 🎒",       body: 'Picked up! Heading to the academy now' },
  ride_at_academy:         { title: 'Arrived at Academy 🏫',   body: "You've arrived. Have a great training session!" },
  ride_completed:          { title: 'Session Complete ✅',      body: "Today's transport is complete. Well done!" },
  ride_cancelled:          { title: 'Transport Cancelled',      body: "Today's transport has been cancelled" },
}

let worker: Worker | null = null

export function startNotificationWorker() {
  worker = new Worker(
    'notifications',
    async (job: any) => {
      const { userId, type, sessionId } = job.data

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user?.fcmToken) {
        console.log(`[Notifications] No FCM token for user ${userId}, skipping`)
        return
      }

      const msg = NOTIFICATION_MESSAGES[type]
      if (!msg) {
        console.warn(`[Notifications] Unknown notification type: ${type}`)
        return
      }

      try {
        // Dynamically import firebase-admin only when needed
        const admin = await import('firebase-admin')
        await admin.messaging().send({
          token: user.fcmToken,
          notification: { title: msg.title, body: msg.body },
          data: { sessionId: sessionId ?? '', type },
        })
        console.log(`[Notifications] Sent ${type} to user ${userId}`)
      } catch (err) {
        console.error(`[Notifications] Failed to send ${type} to ${userId}:`, err)
        throw err
      }
    },
    { connection: redis }
  )

  worker.on('completed', (job: any) => {
    console.log(`[Notifications] Job ${job.id} completed`)
  })

  worker.on('failed', (job: any, err: Error) => {
    console.error(`[Notifications] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[Notifications] Worker error (non-fatal):', err.message)
  })

  console.log('[Notifications] Worker started')
}
