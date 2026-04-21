import { Worker, Queue } from 'bullmq'
import { redis } from '../redis'
import { prisma } from '@sportnexus/db'

export const enrollmentExpiryQueue = new Queue('enrollment-expiry', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 30_000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
})

enrollmentExpiryQueue.on('error', (err) => {
  console.error('[EnrollmentExpiry] Queue error (non-fatal):', err.message)
})

let worker: Worker | null = null

export function startEnrollmentExpiryWorker() {
  worker = new Worker(
    'enrollment-expiry',
    async (job: any) => {
      const { enrollmentId } = job.data as { enrollmentId: string }

      await prisma.$transaction(async (tx) => {
        const enrollment = await tx.enrollment.findUnique({ where: { id: enrollmentId } })

        // Only cancel if still PENDING — if user paid, it's CONFIRMED, skip
        if (!enrollment || enrollment.status !== 'PENDING') return

        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: { status: 'CANCELLED' },
        })

        // Release the held slot back to the pool
        await tx.slot.update({
          where: { id: enrollment.slotId },
          data: { enrolledCount: { decrement: 1 } },
        })

        console.log(`[EnrollmentExpiry] Auto-cancelled enrollment ${enrollmentId} — payment not received within 10 minutes`)
      })
    },
    { connection: redis }
  )

  worker.on('failed', (job: any, err: Error) => {
    console.error(`[EnrollmentExpiry] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[EnrollmentExpiry] Worker error (non-fatal):', err.message)
  })

  console.log('[EnrollmentExpiry] Worker started')
}
