import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { prisma } from '@sportnexus/db'
import { redis } from '../redis'
import { requireAuth } from '../plugins/auth'
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../errors'

// ─── OTP helpers ─────────────────────────────────────────────────────────────

const OTP_TTL_SECONDS = 600  // 10 minutes
const OTP_KEY = (phone: string) => `otp:${phone}`

function generateOTP(): string {
  return String(crypto.randomInt(100000, 999999))
}

async function storeOTP(phone: string, otp: string): Promise<void> {
  const hashed = await bcrypt.hash(otp, 8)
  await redis.set(OTP_KEY(phone), hashed, 'EX', OTP_TTL_SECONDS)
}

async function verifyStoredOTP(phone: string, otp: string): Promise<boolean> {
  const hashed = await redis.get(OTP_KEY(phone))
  if (!hashed) return false
  const valid = await bcrypt.compare(otp, hashed)
  if (valid) await redis.del(OTP_KEY(phone))
  return valid
}

// ─── Email OTP sender ─────────────────────────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter
  const email    = process.env.SMTP_EMAIL
  const password = process.env.SMTP_APP_PASSWORD
  if (!email || !password) throw new Error('SMTP_EMAIL and SMTP_APP_PASSWORD not set in .env')
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: email, pass: password },
  })
  return _transporter
}

async function sendOTPEmail(toEmail: string, otp: string, phone: string): Promise<void> {
  const transporter = getTransporter()
  const from = process.env.SMTP_EMAIL!
  await transporter.sendMail({
    from: `"SportNexus" <${from}>`,
    to: toEmail,
    subject: `${otp} is your SportNexus OTP`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#0F172A;padding:24px;border-radius:12px 12px 0 0;text-align:center">
          <h2 style="color:#14B8A6;margin:0;font-size:24px;letter-spacing:-0.5px">SportNexus</h2>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px">
          <p style="color:#0F172A;font-size:16px;margin:0 0 8px">Your verification code:</p>
          <div style="background:#F0FDF9;border:2px dashed #0D9488;border-radius:10px;padding:20px;text-align:center;margin:16px 0">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#0D9488">${otp}</span>
          </div>
          <p style="color:#64748B;font-size:13px;margin:0">Valid for <strong>10 minutes</strong>. Don't share this code with anyone.</p>
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0">
          <p style="color:#94A3B8;font-size:12px;margin:0">Requested for ${phone}</p>
        </div>
      </div>
    `,
  })
}

// ─── Main sendOTP dispatcher ──────────────────────────────────────────────────

async function sendOTP(phone: string, email?: string | null): Promise<{ sent: boolean; channel: 'email' | 'console' }> {
  const otp = generateOTP()
  await storeOTP(phone, otp)

  const hasEmail = !!(process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD)

  if (hasEmail && email) {
    try {
      await sendOTPEmail(email, otp, phone)
      return { sent: true, channel: 'email' }
    } catch (err: any) {
      console.error(`[OTP] Email failed (${err.code ?? err.message}) — falling back to console`)
    }
  }

  // Dev fallback — print to API console so you can read it
  console.log(`\n┌─────────────────────────────────┐`)
  console.log(`│  [DEV OTP]  ${phone.padEnd(20)} │`)
  console.log(`│  Code: ${otp}                    │`)
  console.log(`└─────────────────────────────────┘\n`)
  return { sent: false, channel: 'console' }
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  firebaseUid: z.string().optional(),
})

const otpSendSchema = z.object({
  phone: z.string().min(10, 'Phone required'),
})

const otpVerifySchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
})

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine((d) => d.email || d.phone, { message: 'Email or phone required' })

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
})

function signTokens(fastify: FastifyInstance, userId: string, role: string) {
  const accessExpiry = process.env.NODE_ENV === 'development' ? '7d' : '15m'
  const accessToken = fastify.jwt.sign(
    { id: userId, role },
    { expiresIn: accessExpiry }
  )
  const refreshToken = fastify.jwt.sign(
    { id: userId, role, type: 'refresh' },
    { expiresIn: '30d' }
  )
  return { accessToken, refreshToken }
}

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register — create user then send OTP
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    let user = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { phone: body.phone }] },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { name: body.name, email: body.email, phone: body.phone, firebaseUid: body.firebaseUid, role: 'USER' },
      })
    }

    const { sent, channel } = await sendOTP(user.phone!, user.email)
    return reply.code(200).send({
      success: true,
      data: { phone: user.phone, email: user.email, otpSent: sent, channel, devMode: !sent },
    })
  })

  // POST /api/auth/otp/send — standalone endpoint to (re)send OTP
  fastify.post('/otp/send', async (request, reply) => {
    const { phone } = otpSendSchema.parse(request.body)
    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) throw new NotFoundError('User')

    const { sent, channel } = await sendOTP(phone, user.email)
    return reply.send({ success: true, data: { phone, otpSent: sent, channel, devMode: !sent } })
  })

  // POST /api/auth/otp/verify — verify OTP and return tokens
  fastify.post('/otp/verify', async (request, reply) => {
    const body = otpVerifySchema.parse(request.body)

    if (!/^\d{6}$/.test(body.otp)) throw new ValidationError('OTP must be 6 digits')

    const user = await prisma.user.findUnique({ where: { phone: body.phone } })
    if (!user) throw new NotFoundError('User')

    const hasEmailCreds = !!(process.env.SMTP_EMAIL && process.env.SMTP_APP_PASSWORD)
    const isDev = process.env.NODE_ENV !== 'production'

    if (hasEmailCreds || !isDev) {
      // Email creds set OR production: verify OTP from Redis
      const valid = await verifyStoredOTP(body.phone, body.otp)
      if (!valid) throw new UnauthorizedError('Invalid or expired OTP. Please request a new one.')
    }
    // else: dev mode, no creds — any 6 digits accepted

    const { accessToken, refreshToken } = signTokens(fastify, user.id, user.role)
    const hashedRefresh = await bcrypt.hash(refreshToken, 10)
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashedRefresh } })

    return reply.send({ success: true, data: { user, accessToken, refreshToken } })
  })

  // POST /api/auth/login — find user then send OTP
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const user = await prisma.user.findFirst({
      where: body.email ? { email: body.email } : { phone: body.phone },
    })
    if (!user) throw new NotFoundError('User')

    const { sent, channel } = await sendOTP(user.phone!, user.email)
    return reply.send({
      success: true,
      data: { phone: user.phone, email: user.email, otpSent: sent, channel, devMode: !sent },
    })
  })

  // POST /api/auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body)

    let decoded: { id: string; role: string }
    try {
      decoded = fastify.jwt.verify(body.refreshToken) as { id: string; role: string }
    } catch {
      throw new UnauthorizedError('Invalid refresh token')
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user?.refreshToken) throw new UnauthorizedError('Session expired')

    const valid = await bcrypt.compare(body.refreshToken, user.refreshToken)
    if (!valid) throw new UnauthorizedError('Invalid refresh token')

    const { accessToken, refreshToken } = signTokens(fastify, user.id, user.role)
    const hashedRefresh = await bcrypt.hash(refreshToken, 10)
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashedRefresh } })

    return reply.send({ success: true, data: { accessToken, refreshToken } })
  })

  // POST /api/auth/logout
  fastify.post('/logout', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user as { id: string }
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } })
    return reply.code(204).send()
  })
}
