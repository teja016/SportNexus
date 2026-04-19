import { Queue } from 'bullmq'
import { redis } from '../redis'
import { prisma } from '@sportnexus/db'
import { notificationQueue } from './notificationWorker'

const dailyTransitQueue = new Queue('daily-transit', {
  connection: redis,
})
dailyTransitQueue.on('error', (err) => {
  console.error('[DailyTransit] Queue error (non-fatal):', err.message)
})

export async function startDailyTransitWorker() {
  // Remove any existing repeatable jobs to avoid duplicates on restart
  const repeatableJobs = await dailyTransitQueue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    await dailyTransitQueue.removeRepeatableByKey(job.key)
  }

  // Schedule daily at 23:30 UTC = 05:00 IST
  await dailyTransitQueue.add(
    'create-daily-sessions',
    {},
    {
      repeat: { pattern: '30 23 * * *' },
      jobId: 'daily-transit-cron',
    }
  )

  // In development, also run immediately on startup
  if (process.env.NODE_ENV === 'development') {
    await dailyTransitQueue.add('create-daily-sessions-init', {}, { delay: 5000 })
  }

  console.log('[DailyTransit] Worker scheduled (23:30 UTC / 05:00 IST)')
}

export async function createDailySessions() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find all confirmed, transport-opted enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: 'CONFIRMED',
      transportOpted: true,
    },
    include: {
      slot: { include: { program: true } },
      user: { select: { id: true, fcmToken: true } },
    },
  })

  let created = 0

  for (const enrollment of enrollments) {
    // Skip if session already exists for today
    const existing = await prisma.transitSession.findUnique({
      where: {
        enrollmentId_date: {
          enrollmentId: enrollment.id,
          date: today,
        },
      },
    })

    if (existing) continue

    // Create session
    await prisma.transitSession.create({
      data: {
        enrollmentId: enrollment.id,
        date: today,
        status: 'SCHEDULED',
      },
    })

    created++

    // Enqueue 9 notifications if user has FCM token
    if (enrollment.user.fcmToken) {
      const slotHour = parseInt(enrollment.slot.timeStart.split(':')[0], 10)
      const slotMinute = parseInt(enrollment.slot.timeStart.split(':')[1], 10)
      const sessionMs = today.getTime() + (slotHour * 60 + slotMinute) * 60000

      const notifications = [
        { type: 'slot_reminder',           delayMins: -60  },
        { type: 'vehicle_arriving',        delayMins: -30  },
        { type: 'pickup_started',          delayMins: -20  },
        { type: 'in_transit',              delayMins: -15  },
        { type: 'arrived',                 delayMins: -5   },
        { type: 'return_vehicle_arriving', delayMins: 60   },
        { type: 'return_pickup',           delayMins: 65   },
        { type: 'return_transit',          delayMins: 70   },
        { type: 'return_arrived',          delayMins: 85   },
      ]

      for (const notif of notifications) {
        const fireAt = sessionMs + notif.delayMins * 60000
        const delay = Math.max(0, fireAt - Date.now())

        await notificationQueue.add(
          notif.type,
          { userId: enrollment.user.id, type: notif.type },
          { delay }
        )
      }
    }
  }

  console.log(`[DailyTransit] Created ${created} sessions for ${today.toDateString()}`)
}
