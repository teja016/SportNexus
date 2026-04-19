import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@sportnexus/db'
import { requireAuth } from '../plugins/auth'
import { NotFoundError, PaymentError, ValidationError } from '../errors'
import { calculateTrainingFee, calculateTransportFee } from '@sportnexus/utils'

const initiateSchema = z.object({
  enrollmentId: z.string().min(1),
})

let razorpayInstance: any = null

function getRazorpay() {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay')
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpayInstance
}

export default async function paymentRoutes(fastify: FastifyInstance) {
  // POST /api/payments/initiate
  fastify.post('/initiate', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const body = initiateSchema.parse(request.body)

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: body.enrollmentId },
      include: {
        slot: { include: { program: true } },
      },
    })

    if (!enrollment) throw new NotFoundError('Enrollment')
    if (enrollment.userId !== userId) throw new ValidationError('Enrollment does not belong to you')

    const trainingFee = calculateTrainingFee(
      enrollment.slot.program.feeMonthly,
      1,
      enrollment.durationMonths
    )
    const transportFee = enrollment.transportOpted
      ? calculateTransportFee(enrollment.pickupDistance ?? 0, enrollment.durationMonths)
      : 0
    const totalAmount = trainingFee + transportFee
    const amountPaise = Math.round(totalAmount * 100)

    let gatewayOrderId = `order_demo_${Date.now()}`
    const razorpay = getRazorpay()

    if (razorpay) {
      try {
        const order = await razorpay.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt: enrollment.id,
        })
        gatewayOrderId = order.id
      } catch (err) {
        console.error('[Payments] Razorpay order creation failed:', err)
        // Fall through to demo mode
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        enrollmentId: enrollment.id,
        amount: trainingFee,
        transportFee,
        totalAmount,
        gatewayOrderId,
        status: 'PENDING',
      },
    })

    return reply.code(201).send({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: gatewayOrderId,
        amount: amountPaise,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID ?? 'rzp_test_demo',
      },
    })
  })

  // POST /api/payments/webhook — Razorpay webhook
  fastify.post('/webhook', async (request, reply) => {
    const signature = (request.headers['x-razorpay-signature'] as string) ?? ''
    const rawBody = JSON.stringify(request.body)

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (webhookSecret) {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')
      const sigBuffer = Buffer.from(signature)
      const expBuffer = Buffer.from(expected)
      if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
        return reply.code(400).send({ success: false, error: { code: 'WEBHOOK_INVALID', message: 'Invalid signature', statusCode: 400 } })
      }
    }

    const event = request.body as any
    if (['payment.captured', 'order.paid'].includes(event.event)) {
      const orderId = event.payload?.payment?.entity?.order_id ?? event.payload?.order?.entity?.id
      const txnId = event.payload?.payment?.entity?.id

      if (orderId) {
        await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.findFirst({ where: { gatewayOrderId: orderId } })
          if (!payment) return

          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'SUCCESS', gatewayTxnId: txnId, webhookVerified: true },
          })
          await tx.enrollment.update({
            where: { id: payment.enrollmentId },
            data: { status: 'CONFIRMED' },
          })
        })
      }
    }

    return reply.send({ received: true })
  })

  // POST /api/payments/confirm — client-side fallback confirmation
  fastify.post('/confirm', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { enrollmentId, gatewayOrderId, gatewayTxnId } = request.body as any

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { enrollmentId, userId },
      })
      if (!payment) throw new NotFoundError('Payment')

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          gatewayOrderId: gatewayOrderId ?? payment.gatewayOrderId,
          gatewayTxnId: gatewayTxnId ?? `txn_demo_${Date.now()}`,
        },
      })

      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'CONFIRMED' },
      })
    })

    return reply.send({ success: true, data: { confirmed: true } })
  })
}
