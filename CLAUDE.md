# SportNexus — Developer Guide

## Overview

SportNexus is a full-stack sports academy booking platform. TypeScript monorepo with:
- `apps/api` — Fastify REST API + Socket.IO (port 3000)
- `apps/mobile` — React Native / Expo SDK 52
- `apps/admin` — Next.js 14 admin dashboard (port 3001)
- `packages/db` — Prisma schema + seed
- `packages/types` — Shared TypeScript interfaces
- `packages/utils` — Shared utility functions

## Prerequisites

- Node.js ≥ 20, npm ≥ 10
- Docker Desktop (for local PostgreSQL + Redis)
- Expo Go app on phone (for mobile development)

## Dev Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example apps/api/.env

# 3. Start PostgreSQL + Redis
npm run docker:up

# 4. Push schema and seed database
npm run db:push
npm run db:seed

# 5. Start API server
npm run dev:api

# 6. (separate terminal) Start admin dashboard
npm run dev:admin

# 7. (separate terminal) Start mobile
npm run dev:mobile
```

## Environment Variables (`apps/api/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | HS256 signing secret (≥ 32 chars) |
| `RAZORPAY_KEY_ID` | Razorpay test/live key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook HMAC secret |
| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded Firebase service account JSON |
| `PORT` | API port (default: 3000) |
| `NODE_ENV` | `development` or `production` |

## Test Credentials (after seed)

| Role | Email | Phone |
|---|---|---|
| User | user@sportshub.com | +919999999999 |
| Academy Admin | admin1@sportshub.com | +918888888881 |
| Super Admin | (set role manually) | — |

OTP: **any 6 digits** accepted in development mode.

## Coding Conventions

- **All API inputs** validated with Zod — `schema.parse(request.body)` at top of handler
- **All API responses** use `{ success: true, data: ... }` or `{ success: false, error: { code, message, statusCode } }`
- **Multi-table writes** use `prisma.$transaction([...])` — never multiple awaits
- **Route files** are Fastify plugins: `export default async function plugin(fastify) { fastify.get(...) }`
- **Mobile API calls** go through `src/services/api.ts` modules — never raw `axios` in screens
- **State** — `authStore` for auth/user, `enrollmentStore` for booking flow only. Reset enrollmentStore after BookingSuccess

## Mobile Dev Notes

- Android emulator: API is at `http://10.0.2.2:3000/api` (not localhost)
- iOS simulator: `http://localhost:3000/api`
- Physical device: use your machine's LAN IP, e.g. `http://192.168.1.x:3000/api`
- Set in `apps/mobile/src/services/api.ts` — `__DEV__` flag controls prod vs dev URL

## API Base URL

- Dev: `http://localhost:3000/api`
- Prod: `https://sportshub-api.onrender.com/api`

## Key Design Decisions

- **OTP is stubbed** — accepts any 6-digit code. Wire up Twilio/Firebase Auth for production.
- **Razorpay** — `POST /confirm` is a client-side fallback for demo. In production, webhook is authoritative.
- **Transit tracking** — Socket.IO rooms named `transit:{sessionId}`. Driver app emits `driver-location`; user app listens.
- **BullMQ workers** — start automatically with the API server. Queue: `notifications`. Cron: `dailyTransit` at 23:30 UTC (05:00 IST).
- **Redis caching** — academy list TTL 5 min, academy detail TTL 10 min, keyed by query hash.

## Database

```bash
# View schema
cat packages/db/prisma/schema.prisma

# Open Prisma Studio
npm run db:studio

# Reset and reseed
npx prisma db push --force-reset --schema=packages/db/prisma/schema.prisma
npm run db:seed
```
