# SportNexus — Architecture Deep Dive

SportNexus is a **TypeScript monorepo** for a sports academy booking platform. It's organized using **npm workspaces + Turborepo**, with three deployable apps and three shared packages.

## 1. Repository Layout

```
SportNexus/
├── apps/
│   ├── api/      → Fastify REST + Socket.IO backend (port 3000)
│   ├── admin/    → Next.js 14 admin dashboard (port 3001)
│   └── mobile/   → React Native / Expo SDK 52 mobile app
├── packages/
│   ├── db/       → Prisma schema, client, seed
│   ├── types/    → Shared TS interfaces (DTOs, ApiResponse<T>)
│   └── utils/    → Pure helpers (geo/Haversine, currency, time)
├── docker-compose.yml  → Postgres 16 + Redis 7 + API
├── render.yaml         → Render cloud deployment manifest
└── turbo.json          → Build pipeline orchestration
```

The `@sportnexus/db`, `@sportnexus/types`, `@sportnexus/utils` packages are consumed by all three apps via workspace protocol — one source of truth for the data model and DTOs.

## 2. Three-Tier Architecture

```
┌──────────── CLIENT TIER ────────────┐
│  Mobile (RN/Expo)   Admin (Next.js) │
└──────────┬──────────────────┬───────┘
           │ HTTPS + WSS      │ HTTPS
┌──────────▼──────────────────▼───────┐
│       APPLICATION TIER (Fastify)    │
│  REST routes • JWT • Socket.IO •    │
│  BullMQ workers • Razorpay • FCM    │
└──────────┬──────────────────┬───────┘
           │                  │
   ┌───────▼──────┐   ┌──────▼──────┐
   │ PostgreSQL16 │   │   Redis 7   │
   │  (Prisma)    │   │ Queue+Cache │
   └──────────────┘   └─────────────┘
```

## 3. Backend — `apps/api`

A single **Fastify 4** server bootstrapped in `apps/api/src/index.ts` that does five things:

### 3.1 Plugin pipeline (in order)
1. **`@fastify/cors`** — open CORS with credentials
2. **`@fastify/jwt`** — HS256 token signing/verification (15-min access tokens)
3. **`@fastify/rate-limit`** — Redis-backed, 100 req/min globally
4. **Global error handler** — normalises `AppError`, Zod errors, and unknown errors to `{ success: false, error: { code, message, statusCode } }`
5. **Health endpoint** `/api/health` — pings Postgres + Redis

### 3.2 Domain routes (each is a Fastify plugin)
Mounted under `/api` in `apps/api/src/routes/`:

| Route prefix | File | Concern |
|---|---|---|
| `/api/auth` | `auth.ts` | OTP send/verify, refresh tokens (OTP stubbed in dev — any 6 digits) |
| `/api/users` | `users.ts` | Profile, FCM token registration |
| `/api/academies` | `academies.ts` | Geo-search (Haversine), filters, detail |
| `/api/programs` | `programs.ts` | Sport programs + slots |
| `/api/enrollments` | `enrollments.ts` | Booking with `prisma.$transaction` for slot-capacity safety |
| `/api/payments` | `payments.ts` | Razorpay order creation + HMAC-SHA256 webhook |
| `/api/transit` | `transit.ts` | Transit session CRUD |
| `/api/admin` | `admin.ts` | Academy/enrollment/revenue dashboards |

Convention enforced everywhere: **Zod validation at the top of every handler**, **multi-table writes wrapped in `prisma.$transaction`**, **`{ success, data }` response envelope**.

### 3.3 Real-time layer — Socket.IO
`apps/api/src/socket.ts` attaches to the same HTTP server. Rooms are named `transit:{sessionId}`. Three events:

- `join-transit` → joins a room and **replays the last GPS fix from Redis** (`transit:loc:{sessionId}`, 60 s TTL) so reconnecting users catch up instantly
- `driver-location` → driver emits `{lat,lng,eta,status}` ~every 3s; server caches in Redis, persists to `TransitSession`, fans out `location-update`
- `transit-status` → updates DB and **enqueues an FCM push** via BullMQ for meaningful transitions (DISPATCHED, ARRIVING, PICKED_UP, AT_ACADEMY, COMPLETED, CANCELLED)

### 3.4 Background workers (BullMQ)
Started after HTTP listen so worker crashes don't block the API (`apps/api/src/workers/`):

| Worker | Purpose |
|---|---|
| `notificationWorker.ts` | Consumes `notifications` queue → Firebase Admin → FCM push |
| `dailyTransitWorker.ts` | Cron at 23:30 UTC (05:00 IST) — generates next-day transit sessions |
| `enrollmentExpiryWorker.ts` | Marks expired enrollments based on duration end |

A safety check inspects Redis version and **disables workers if Redis < 5** (BullMQ requirement) instead of crashing.

### 3.5 Resilience hooks
`uncaughtException` and `unhandledRejection` are logged but **do not exit** — the HTTP server stays up.

## 4. Data layer — `packages/db`

Single `schema.prisma` with the entity graph:

```
User ──┬─< Enrollment >── Slot ── SportProgram ── Academy ──< Coach
       │                                              │
       ├─< Payment                                    ├─< AcademyPhoto
       │                                              ├─< TransportRoute
       └─< TransitSession (driver via DRIVER role)    └─< Review
```

Enums drive state machines: `EnrollmentStatus`, `PaymentStatus`, `TransitStatus`, `PassengerStatus`, `UserRole` (USER, ACADEMY_ADMIN, SUPER_ADMIN, TRANSPORT_OPERATOR, DRIVER). Indexes on `User.email`, `User.phone`, and academy `lat`/`lng` support hot lookups.

The package re-exports a singleton `PrismaClient` consumed as `import { prisma } from '@sportnexus/db'`.

## 5. Mobile app — `apps/mobile`

React Native + Expo SDK 52. Key structure under `src/`:

- **`screens/`** — segmented by flow: `auth/`, `main/`, `enrollment/`, `driver/`
- **`navigation/`** — `RootNavigator` (stack) + `MainTabNavigator` (bottom tabs)
- **`store/`** — Zustand stores: `authStore` (user/tokens), `enrollmentStore` (booking flow state, reset post-success), `favoritesStore`, `notificationsStore`, `localEnrollmentsStore`
- **`services/api.ts`** — single axios instance with auth interceptor; `__DEV__` flag picks dev vs prod base URL. **Screens never call axios directly.**
- **`hooks/`** — `useTransitSocket` (Socket.IO client room mgmt), `useDriverLocation` (Expo Location → emit), `useFCMToken` (with `.web.ts` no-op variant)
- **`components/`** — `TrackingMap` has platform variants (`.native.tsx`, `.web.tsx`) for react-native-maps vs web fallback
- **`constants/theme.ts`** — design tokens

Android folder is bare-workflow output for native release builds; everyday dev uses Expo Go.

## 6. Admin dashboard — `apps/admin`

Next.js 14 **App Router** at `apps/admin/src/app/`. One folder per resource (`academies`, `enrollments`, `programs`, `users`, `payments`, `transit`, `login`). Shared UI in `components/`: `DataTable`, `StatCard`, `StatusBadge`, `Sidebar`, `LayoutShell`, `ApiDownBanner`. All HTTP goes through `services/apiClient.ts` using the same `{ success, data }` envelope as the mobile app. Tailwind CSS for styling.

## 7. Cross-cutting flows

**Booking + payment**

```
Mobile → POST /api/enrollments  (Zod → prisma.$transaction:
                                   check slot capacity,
                                   create Enrollment,
                                   increment Slot.enrolledCount)
       → POST /api/payments/order      (Razorpay order)
       → Razorpay checkout (UPI/Card/etc.)
       → Razorpay webhook → /api/payments/webhook (HMAC verify, mark SUCCESS)
       → BullMQ: enqueue confirmation push → FCM
```

**Live transit tracking**

```
Driver app → useDriverLocation → socket.emit('driver-location')
   ↓
API: cache in Redis (60s TTL) + persist to TransitSession + fanout
   ↓
User app: room 'transit:{id}' → renders on TrackingMap
   ↓
Status transitions → BullMQ → FCM push (9 notifications across the day)
```

## 8. Infrastructure

- **Local dev**: `docker-compose.yml` brings up Postgres 16, Redis 7, and (optionally) the API container. Volumes mounted for hot reload.
- **Cloud**: `render.yaml` declares Render Web Service + Managed Postgres + Managed Redis.
- **Mobile builds**: `eas.json` drives Expo Application Services for APK/IPA CI builds.
- **Caching**: Redis stores BullMQ jobs, rate-limit counters, transit GPS buffer, and academy list/detail caches (5-min / 10-min TTL keyed by query hash).

## 9. Security posture

- HS256 JWT (≥32-char secret), 15-min access + refresh tokens (refresh hashed at rest)
- Zod validation at every boundary
- Razorpay webhook secured with HMAC-SHA256 signature verification (webhook is authoritative; client `/confirm` is a demo fallback)
- Role-based authorization via the `auth` plugin in `apps/api/src/plugins/auth.ts`
- Redis-backed global rate limit; per-route limits can be layered on
- CORS currently `origin: true` (acceptable for dev; tighten for prod)

---

A single Fastify process serves REST + WebSockets, backed by Postgres for state and Redis for queues/cache/pub-sub, with two TypeScript clients (mobile + admin) sharing types and DTOs through workspace packages.
