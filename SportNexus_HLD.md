# SportNexus — High-Level Design Document

**Project:** SportNexus (SportsHub)
**Version:** 2.0.0
**Date:** April 2026
**Repository:** [github.com/teja016/SportNexus](https://github.com/teja016/SportNexus)
**Authors:** Teja
**Status:** Final Draft

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Models](#4-data-models)
5. [API Design](#5-api-design)
6. [Mobile Application](#6-mobile-application)
7. [Admin Dashboard](#7-admin-dashboard)
8. [Real-Time Features](#8-real-time-features)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Payment System](#10-payment-system)
11. [Transit & Transport Tracking](#11-transit--transport-tracking)
12. [Notification System](#12-notification-system)
13. [Infrastructure & Deployment](#13-infrastructure--deployment)
14. [Caching & Performance](#14-caching--performance)
15. [Error Handling & Resilience](#15-error-handling--resilience)
16. [Security Architecture](#16-security-architecture)
17. [Observability & Monitoring](#17-observability--monitoring)
18. [Testing Strategy](#18-testing-strategy)
19. [User Flows](#19-user-flows)
20. [Shared Packages](#20-shared-packages)
21. [Seed Data](#21-seed-data)
22. [Future Roadmap](#22-future-roadmap)

---

## 1. Introduction

### 1.1 Purpose

SportNexus is a production-grade, full-stack platform connecting end users with sports academies across India. It enables geo-aware academy discovery, program enrollment with multi-slot selection, Razorpay-integrated payments, and optional transport booking with real-time Socket.IO-powered GPS tracking. The platform is built as a TypeScript monorepo, deployed on Render (cloud), and targets Android/iOS via Expo.

### 1.2 Problem Statement

Parents and athletes have no unified platform to:
- Discover verified sports academies near them
- Compare programs, coaches, fees, and schedules
- Complete enrollment and payments in one flow
- Track their child's pickup/drop vehicle in real time

SportNexus solves all four gaps in a single product.

### 1.3 Key Features

| Feature | Description | Priority |
|---|---|---|
| **Academy Discovery** | Haversine-based geo-search with radius, sport type, rating, transport, and price filters | P0 |
| **Program & Slot Booking** | Multi-slot selection across morning/evening bands, 1/3/6/12-month durations | P0 |
| **Payment Integration** | Razorpay gateway (UPI, Card, Net Banking, Wallet) with HMAC-SHA256 webhook verification | P0 |
| **Real-Time Transit Tracking** | Socket.IO live GPS tracking with ETA, progress stepper, driver contact | P0 |
| **Transport Booking** | Optional pickup/drop at ₹25/km (round trip, 26 days/month), distance-based pricing | P1 |
| **Enrollment Management** | Active/past views, status lifecycle, QR code generation, WhatsApp share | P1 |
| **Admin Dashboard** | Academy management, enrollment tracking, slot capacity, revenue analytics | P1 |
| **Push Notifications** | 9 FCM notifications per daily transport session (reminders → pickup → transit → return) | P2 |
| **Role-Based Access** | 4 roles: User, Academy Admin, Super Admin, Transport Operator | P0 |

### 1.4 Non-Goals (v1.0)

- Native iOS deep linking (placeholder only)
- In-app chat between coach and student
- Multi-currency or international pricing
- Coach availability calendar
- AI-driven academy recommendations

### 1.5 Target Users

| Role | Description | Key Workflows |
|---|---|---|
| **User** | Parent or athlete discovering and enrolling | Discovery → Enroll → Pay → Track |
| **Academy Admin** | Academy owner managing operations | Create programs → Manage slots → View revenue |
| **Super Admin** | Platform operator | Verify academies → Global analytics |
| **Transport Operator** | Driver updating live location | Join transit room → Broadcast GPS |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
╔══════════════════════════════════════════════════════════════════════╗
║                           CLIENT TIER                                ║
║  ┌──────────────────────┐  ┌───────────────────┐  ┌───────────────┐  ║
║  │   Mobile App          │  │  Admin Dashboard   │  │  Expo Go      │  ║
║  │  React Native / Expo  │  │  Next.js 14        │  │  Dev Preview  │  ║
║  └──────────┬───────────┘  └────────┬──────────┘  └──────┬────────┘  ║
╚═════════════╪══════════════════════╪═════════════════════╪═══════════╝
              │ HTTPS / WSS          │ HTTPS               │ HTTPS/WSS
              ▼                      ▼                     ▼
╔══════════════════════════════════════════════════════════════════════╗
║                         APPLICATION TIER                             ║
║  ┌─────────────────────────────────────────────────────────────┐     ║
║  │                   Fastify 4 API Server                       │     ║
║  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │     ║
║  │  │ REST API │  │ JWT Auth │  │Socket.IO │  │ Razorpay   │  │     ║
║  │  │ (Zod     │  │ (@f/jwt) │  │ 4.x      │  │ Webhooks   │  │     ║
║  │  │  valid.) │  └──────────┘  └────┬─────┘  └────────────┘  │     ║
║  │  └────┬─────┘                     │                         │     ║
║  │       │    ┌──────────────────────┘                         │     ║
║  │  ┌────▼────▼─────────────────────────────────────────────┐  │     ║
║  │  │                    Prisma ORM 5                        │  │     ║
║  │  └────────────────────────────────────────────────────────┘  │     ║
║  │                                                               │     ║
║  │  ┌─────────────────┐   ┌─────────────────────────────────┐  │     ║
║  │  │  BullMQ Worker   │   │  Firebase Admin (FCM Push)      │  │     ║
║  │  │  (Notification   │   │                                 │  │     ║
║  │  │   Job Queue)     │   └─────────────────────────────────┘  │     ║
║  │  └─────────────────┘                                         │     ║
║  └─────────────────────────────────────────────────────────────┘     ║
╚══════════════════════════════════════════════════════════════════════╝
              │                              │
   ┌──────────▼────────────┐   ┌────────────▼────────────┐
   │     PostgreSQL 16      │   │        Redis 7           │
   │  (Primary data store)  │   │  ┌──────────────────┐   │
   │  • Users               │   │  │ BullMQ job queue │   │
   │  • Academies           │   │  │ Session cache     │   │
   │  • Enrollments         │   │  │ Transit pub/sub   │   │
   │  • Payments            │   │  └──────────────────┘   │
   │  • TransitSessions     │   └─────────────────────────┘
   └───────────────────────┘
```

### 2.2 Request Lifecycle

```
Mobile Client
    │
    │ 1. HTTPS POST /api/enrollments
    │    Authorization: Bearer <accessToken>
    ▼
Fastify Route Handler
    │
    │ 2. @fastify/jwt verifies token (15-min expiry)
    ▼
Zod Schema Validation
    │
    │ 3. Validate request body shape & types
    ▼
Route Handler Logic
    │
    │ 4. Prisma atomic transaction
    │   ├─ Check slot capacity
    │   ├─ Create Enrollment record
    │   └─ Increment slot.enrolledCount
    ▼
Response → 201 Created { enrollment }
    │
    │ 5. BullMQ: enqueue confirmation notification job
    ▼
FCM Push Notification → User Device
```

### 2.3 Monorepo Structure

```
sportnexus/
├── apps/
│   ├── api/                    # Fastify REST API + Socket.IO
│   │   ├── src/
│   │   │   ├── routes/         # Route handlers by domain
│   │   │   │   ├── auth.ts
│   │   │   │   ├── academies.ts
│   │   │   │   ├── enrollments.ts
│   │   │   │   ├── payments.ts
│   │   │   │   ├── transit.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── admin.ts
│   │   │   ├── plugins/        # Fastify plugins (jwt, cors, redis)
│   │   │   ├── workers/        # BullMQ job processors
│   │   │   ├── socket/         # Socket.IO event handlers
│   │   │   ├── services/       # Business logic layer
│   │   │   └── index.ts        # Server bootstrap
│   │   ├── Dockerfile
│   │   └── tsconfig.json
│   │
│   ├── mobile/                 # React Native (Expo SDK 52)
│   │   ├── src/
│   │   │   ├── screens/        # One file per screen
│   │   │   ├── navigation/     # Stack + Tab navigators
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── services/       # Axios API modules
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   └── constants/      # Theme, config, icons
│   │   ├── app.json
│   │   └── eas.json
│   │
│   └── admin/                  # Next.js 14 (App Router)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx        # Overview
│       │   ├── academies/
│       │   ├── enrollments/
│       │   ├── programs/
│       │   ├── users/
│       │   ├── transit/
│       │   └── payments/
│       └── components/
│
├── packages/
│   ├── db/                     # Prisma schema + migrations + seed
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── index.ts            # Re-exports PrismaClient
│   │
│   ├── types/                  # Shared TypeScript interfaces
│   │   └── src/
│   │       ├── user.ts
│   │       ├── academy.ts
│   │       ├── enrollment.ts
│   │       ├── payment.ts
│   │       ├── transit.ts
│   │       └── api.ts          # ApiResponse<T>, PaginatedResponse<T>
│   │
│   └── utils/                  # Pure utility functions
│       └── src/
│           ├── geo.ts          # Haversine, distance formatting
│           ├── currency.ts     # INR formatting
│           ├── time.ts         # Time formatting helpers
│           └── constants.ts    # Sport icons, day names, sport types
│
├── docker-compose.yml          # PostgreSQL 16 + Redis 7 + API
├── render.yaml                 # Render cloud deployment manifest
├── turbo.json                  # Turborepo build pipeline
└── package.json                # Root pnpm workspace config
```

---

## 3. Technology Stack

### 3.1 Mobile App (React Native / Expo)

| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.76.3 | Cross-platform mobile framework |
| Expo SDK | 52 | Build tooling, OTA updates, native module bridging |
| React Navigation | 6.x | Stack + Bottom Tab navigation with type-safe routes |
| Zustand | 4.5.5 | Lightweight global state (auth, enrollment flow) |
| TanStack Query | 5.56.0 | Server state caching, background refetch, stale-while-revalidate |
| Axios | 1.7.7 | HTTP client with request/response interceptors |
| Socket.IO Client | 4.7.5 | Real-time WebSocket communication for transit |
| React Native Maps | 1.18.0 | Map rendering (Google Maps on Android, Apple Maps on iOS) |
| Expo Location | 17.x | GPS access, reverse geocoding |
| Expo Notifications | 0.x | FCM/APNs push notification receipt |
| Expo Image Picker | 15.x | Camera roll photo selection for profile |
| React Native Reanimated | 3.16.1 | 60fps UI animations (worklets on the UI thread) |
| React Native QRCode SVG | 6.3.2 | SVG-based QR code generation for booking receipts |
| Expo Linking | — | Deep link handling (`sportshub://`) |

### 3.2 Admin Dashboard (Next.js)

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14 (App Router) | SSR + file-based routing |
| Tailwind CSS | 3.x | Utility-first styling |
| Recharts | — | Revenue and enrollment analytics charts |
| Axios | — | Client-side API communication |
| React Hook Form | — | Admin form validation |

### 3.3 Backend API (Fastify)

| Technology | Version | Purpose |
|---|---|---|
| Fastify | 4.28.0 | High-performance HTTP/2 server (hooks, plugins, schema serialization) |
| Prisma | 5.22.0 | Type-safe PostgreSQL ORM with migration engine |
| Socket.IO | 4.7.5 | Bidirectional WebSocket events for transit rooms |
| @fastify/jwt | 8.0.1 | RS256/HS256 JWT signing and `request.jwtVerify()` |
| @fastify/cors | 9.0.1 | CORS header management |
| @fastify/rate-limit | — | Per-route rate limiting (Redis-backed) |
| BullMQ | 5.12.0 | Reliable job queue (Redis-backed) for FCM notifications |
| IORedis | 5.4.1 | Redis client with Cluster support |
| Razorpay SDK | 2.9.4 | Order creation + HMAC-SHA256 webhook verification |
| Firebase Admin | 12.3.0 | Server-side FCM push notifications |
| Zod | 3.23.8 | Runtime schema validation (request bodies, env vars) |
| Winston | — | Structured JSON logging |

### 3.4 Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL 16 | Primary ACID-compliant relational database |
| Redis 7 | Job queue (BullMQ), session cache, Socket.IO pub/sub adapter |
| Docker Compose | Reproducible local dev environment |
| Render | Cloud hosting (Web Service + Managed Redis + Managed PostgreSQL) |
| EAS Build | Expo Application Services for APK/IPA CI builds |
| Turborepo | Monorepo build orchestration with remote caching |

---

## 4. Data Models

### 4.1 Entity Relationship Diagram

```
┌─────────┐   1      N   ┌───────────────┐   1      N   ┌────────────┐
│  User   │─────────────▶│    Academy     │─────────────▶│   Coach    │
│         │  adminUserId  │               │              └────────────┘
└────┬────┘               └──────┬────────┘
     │                           │ 1
     │                           ├──────────── N ──▶ AcademyPhoto
     │                           │ 1
     │                           ├──────────── N ──▶ TransportRoute
     │                           │ 1
     │                    ┌──────▼────────┐
     │                    │  SportProgram  │
     │                    └──────┬────────┘
     │                           │ 1
     │                    ┌──────▼────┐
     │                    │    Slot    │
     │                    └──────┬────┘
     │                           │ N
     │ 1          N   ┌──────────▼──────┐   1      1   ┌──────────┐
     └───────────────▶│   Enrollment    │─────────────▶│ Payment  │
          userId      └──────┬──────────┘              └──────────┘
                             │ 1
                      ┌──────▼────────────┐
                      │  TransitSession   │
                      └───────────────────┘
```

### 4.2 Prisma Schema (Annotated)

#### User

```prisma
model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  phone        String    @unique               // Format: +91XXXXXXXXXX
  dob          DateTime?
  profilePhoto String?                         // Cloudinary/S3 URL
  homeLat      Float?
  homeLng      Float?
  homeAddress  String?
  role         UserRole  @default(USER)
  firebaseUid  String?   @unique
  refreshToken String?                         // Hashed before storage
  fcmToken     String?                         // FCM device token for push
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  enrollments  Enrollment[]
  payments     Payment[]
  academies    Academy[]   @relation("AcademyAdmin")

  @@index([email])
  @@index([phone])
}

enum UserRole {
  USER
  ACADEMY_ADMIN
  SUPER_ADMIN
  TRANSPORT_OPERATOR
}
```

#### Academy

```prisma
model Academy {
  id                 String   @id @default(cuid())
  name               String
  description        String
  address            String
  city               String
  lat                Float                     // Indexed for geo-queries
  lng                Float
  rating             Float    @default(0)
  reviewCount        Int      @default(0)
  transportAvailable Boolean  @default(false)
  phone              String?
  email              String?
  isVerified         Boolean  @default(false)
  adminUserId        String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  admin              User?           @relation("AcademyAdmin", fields: [adminUserId], references: [id])
  photos             AcademyPhoto[]
  coaches            Coach[]
  programs           SportProgram[]
  transportRoutes    TransportRoute[]

  @@index([lat, lng])
  @@index([city])
  @@index([rating])
}
```

#### SportProgram

```prisma
model SportProgram {
  id             String   @id @default(cuid())
  academyId      String
  sportType      String                        // "Cricket" | "Football" | ...
  name           String
  description    String?
  ageGroupMin    Int      @default(5)
  ageGroupMax    Int      @default(60)
  feeMonthly     Float                         // INR per month per slot
  durationMonths Int      @default(1)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())

  academy        Academy  @relation(fields: [academyId], references: [id], onDelete: Cascade)
  slots          Slot[]

  @@index([academyId])
  @@index([sportType])
}
```

#### Slot

```prisma
model Slot {
  id             String   @id @default(cuid())
  programId      String
  timeStart      String                        // "HH:MM" 24-hour format
  timeEnd        String
  daysOfWeek     String[]                      // ["Mon","Wed","Fri"]
  totalCapacity  Int
  enrolledCount  Int      @default(0)
  isActive       Boolean  @default(true)

  program        SportProgram @relation(fields: [programId], references: [id], onDelete: Cascade)
  enrollments    Enrollment[]

  @@index([programId])
}
```

#### Enrollment

```prisma
model Enrollment {
  id              String           @id @default(cuid())
  userId          String
  slotId          String
  transportOpted  Boolean          @default(false)
  pickupLat       Float?
  pickupLng       Float?
  pickupAddress   String?
  pickupDistance  Float?                       // km from academy
  durationMonths  Int              @default(1)
  status          EnrollmentStatus @default(PENDING)
  enrolledAt      DateTime         @default(now())
  expiresAt       DateTime?
  updatedAt       DateTime         @updatedAt

  user            User             @relation(fields: [userId], references: [id])
  slot            Slot             @relation(fields: [slotId], references: [id])
  payment         Payment?
  transitSessions TransitSession[]

  @@unique([userId, slotId])                  // Prevent duplicate enrollments
  @@index([userId])
  @@index([slotId])
  @@index([status])
}

enum EnrollmentStatus {
  PENDING       // Enrollment created, payment not completed
  CONFIRMED     // Payment successful
  ACTIVE        // Training in progress
  CANCELLED     // User cancelled
  EXPIRED       // Auto-expired (BullMQ TTL job)
}
```

#### Payment

```prisma
model Payment {
  id              String        @id @default(cuid())
  userId          String
  enrollmentId    String        @unique
  amount          Float                        // Training fee (INR)
  transportFee    Float         @default(0)   // Transport fee (INR)
  totalAmount     Float                        // amount + transportFee
  currency        String        @default("INR")
  gateway         String        @default("razorpay")
  gatewayOrderId  String?       @unique
  gatewayTxnId    String?       @unique
  status          PaymentStatus @default(PENDING)
  webhookVerified Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User          @relation(fields: [userId], references: [id])
  enrollment      Enrollment    @relation(fields: [enrollmentId], references: [id])

  @@index([userId])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}
```

#### TransportRoute

```prisma
model TransportRoute {
  id            String   @id @default(cuid())
  academyId     String
  vehicleId     String
  driverId      String
  driverName    String
  driverPhone   String
  vehicleNumber String
  vehicleType   String   @default("Van")      // "Van" | "Bus" | "Auto"
  isActive      Boolean  @default(true)

  academy       Academy  @relation(fields: [academyId], references: [id])

  @@index([academyId])
}
```

#### TransitSession

```prisma
model TransitSession {
  id            String        @id @default(cuid())
  enrollmentId  String
  date          DateTime                       // Session date (date only, no time)
  status        TransitStatus @default(SCHEDULED)
  driverLat     Float?
  driverLng     Float?
  etaMinutes    Int?
  driverName    String?
  driverPhone   String?
  vehicleNumber String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  enrollment    Enrollment    @relation(fields: [enrollmentId], references: [id])

  @@unique([enrollmentId, date])              // One session per enrollment per day
  @@index([enrollmentId])
  @@index([date])
}

enum TransitStatus {
  SCHEDULED
  DISPATCHED
  ARRIVING
  PICKED_UP
  AT_ACADEMY
  COMPLETED
}
```

#### Coach

```prisma
model Coach {
  id              String   @id @default(cuid())
  academyId       String
  name            String
  photo           String?
  sportTags       String[]
  experienceYears Int
  bio             String?
  certifications  String[]
  isActive        Boolean  @default(true)

  academy         Academy  @relation(fields: [academyId], references: [id], onDelete: Cascade)

  @@index([academyId])
}
```

#### AcademyPhoto

```prisma
model AcademyPhoto {
  id        String  @id @default(cuid())
  academyId String
  url       String
  isPrimary Boolean @default(false)
  altText   String?

  academy   Academy @relation(fields: [academyId], references: [id], onDelete: Cascade)

  @@index([academyId])
}
```

---

## 5. API Design

### 5.1 Base Configuration

| Property | Value |
|---|---|
| Framework | Fastify 4 with TypeScript |
| Base Path | `/api` |
| Auth | JWT (HS256) — 15-minute access, rotating refresh tokens |
| Validation | Zod for all request bodies; Fastify JSON schema for response serialization |
| Rate Limiting | `@fastify/rate-limit` — 100 req/min per IP (Redis-backed) |
| CORS | All origins in dev; restricted origin list in production |
| Content-Type | `application/json` |
| Health Check | `GET /api/health` → `{ status: "ok", version, timestamp, db: "connected" }` |

### 5.2 Standard Response Envelopes

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 50, "cursor": "abc" }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "SLOT_FULL",
    "message": "This slot has reached maximum capacity",
    "statusCode": 409
  }
}
```

### 5.3 Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource not found |
| `SLOT_FULL` | 409 | Slot enrollment count ≥ capacity |
| `DUPLICATE_ENROLLMENT` | 409 | User already enrolled in this slot |
| `PAYMENT_FAILED` | 402 | Gateway payment failure |
| `WEBHOOK_INVALID` | 400 | HMAC signature mismatch |
| `VALIDATION_ERROR` | 422 | Zod schema validation failure |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

### 5.4 Authentication Endpoints — `/api/auth`

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| `POST` | `/register` | No | `{ name, email, phone, firebaseUid? }` | `{ user, accessToken, refreshToken }` | Idempotent — returns existing user if phone/email match |
| `POST` | `/otp/verify` | No | `{ phone, otp }` | `{ user, accessToken, refreshToken }` | Dev: any 6-digit OTP accepted |
| `POST` | `/login` | No | `{ email? } \| { phone? }` | `{ user, accessToken, refreshToken }` | — |
| `POST` | `/refresh` | No | `{ refreshToken }` | `{ accessToken, refreshToken }` | Rotates both tokens; old refresh token invalidated |
| `POST` | `/logout` | Yes | — | `204 No Content` | Clears DB refresh token |

### 5.5 User Endpoints — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/me` | Yes | Current user profile |
| `PATCH` | `/me` | Yes | Update: `name`, `dob`, `profilePhoto`, `homeLat`, `homeLng`, `homeAddress`, `fcmToken` |
| `GET` | `/me/enrollments` | Yes | Enrollments with slot → program → academy → payment relations |

### 5.6 Academy Endpoints — `/api/academies`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | No | Geo-sorted list with cursor pagination |
| `GET` | `/:id` | No | Full detail: photos, coaches, programs (with slots) |
| `GET` | `/:id/programs` | No | Programs with slots for an academy |

**Query Parameters for `GET /`:**

| Param | Type | Default | Description |
|---|---|---|---|
| `lat` | Float | — | User latitude for distance calculation |
| `lng` | Float | — | User longitude |
| `radius` | Int | 25 | Search radius in km |
| `sport` | String | — | Filter by sport type |
| `transport` | Boolean | — | Filter transport-available only |
| `rating` | Float | — | Minimum rating threshold |
| `minFee` | Float | — | Minimum monthly fee |
| `maxFee` | Float | — | Maximum monthly fee |
| `search` | String | — | Full-text search on name/description |
| `cursor` | String | — | Pagination cursor (academy ID) |
| `limit` | Int | 20 (max 50) | Page size |

**Distance Calculation (Haversine Formula):**
```
R = 6371 km (Earth radius)
dLat = (lat2 - lat1) × π/180
dLng = (lng2 - lng1) × π/180
a = sin²(dLat/2) + cos(lat1) × cos(lat2) × sin²(dLng/2)
distance = 2R × atan2(√a, √(1-a))
```

### 5.7 Program & Slot Endpoints — `/api/programs`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/:programId/slots` | No | Program detail + all slots |
| `GET` | `/:programId/slots/:slotId/availability` | No | `{ available: bool, total: int, enrolled: int, remaining: int }` |

### 5.8 Enrollment Endpoints — `/api/enrollments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Yes | Create enrollment (atomic transaction) |
| `GET` | `/me` | Yes | User's enrollments (`?status=ACTIVE\|PENDING\|COMPLETED\|CANCELLED`) |
| `GET` | `/:id` | Yes | Single enrollment with full relations |
| `DELETE` | `/:id` | Yes | Cancel enrollment (atomic transaction) |

**POST `/api/enrollments` Request Body:**
```json
{
  "slotId": "cuid",
  "transportOpted": true,
  "pickupLat": 17.385,
  "pickupLng": 78.486,
  "pickupAddress": "123 Main Street, Banjara Hills",
  "pickupDistance": 4.2,
  "durationMonths": 3
}
```

**Enrollment Creation Transaction:**
```
BEGIN TRANSACTION
  1. SELECT slot WHERE id = slotId FOR UPDATE        (lock row)
  2. IF slot.enrolledCount >= slot.totalCapacity → ROLLBACK → 409
  3. IF EXISTS enrollment WHERE userId AND slotId → ROLLBACK → 409
  4. INSERT INTO Enrollment ...
  5. UPDATE Slot SET enrolledCount = enrolledCount + 1
COMMIT
```

### 5.9 Payment Endpoints — `/api/payments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/initiate` | Yes | Create Razorpay order + Payment record (PENDING) |
| `POST` | `/webhook` | No | Razorpay webhook with HMAC-SHA256 verification |
| `POST` | `/confirm` | Yes | Client-side payment confirmation (demo/fallback) |

**POST `/api/payments/initiate` Response:**
```json
{
  "paymentId": "cuid",
  "orderId": "order_XXXXXX",
  "amount": 450000,
  "currency": "INR",
  "key": "rzp_test_XXXXXXXX"
}
```
> Amount is in paise (×100).

**Webhook Verification:**
```
signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_WEBHOOK_SECRET)
if signature !== x-razorpay-signature header → 400 WEBHOOK_INVALID
```

### 5.10 Transit Endpoints — `/api/transit`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/today` | Yes | Today's transit sessions for authenticated user |
| `GET` | `/:id` | Yes | Single transit session with enrollment + user contact |
| `POST` | `/` | No | Create transit session (called by operator/driver app) |
| `PATCH` | `/:id/status` | No | Update transit status (operator) |

### 5.11 Admin Endpoints — `/api/admin`

| Method | Endpoint | Role Required | Description |
|---|---|---|---|
| `GET` | `/dashboard` | ACADEMY_ADMIN or SUPER_ADMIN | Analytics scoped by role |
| `POST` | `/academies` | SUPER_ADMIN or ACADEMY_ADMIN | Create academy |
| `PATCH` | `/academies/:id` | ACADEMY_ADMIN (own) or SUPER_ADMIN | Update academy details |
| `PATCH` | `/slots/:id` | ACADEMY_ADMIN or SUPER_ADMIN | Update slot capacity/times/days |
| `GET` | `/enrollments` | ACADEMY_ADMIN or SUPER_ADMIN | List enrollments (scoped, limit 50) |
| `GET` | `/revenue` | ACADEMY_ADMIN or SUPER_ADMIN | Revenue breakdown by month |

**Dashboard Response:**
```json
{
  "totalEnrollments": 142,
  "todayEnrollments": 8,
  "activeSlots": 24,
  "totalRevenue": 284500,
  "enrollmentsByStatus": { "ACTIVE": 98, "PENDING": 12, "CANCELLED": 32 },
  "revenueByMonth": [
    { "month": "2026-01", "amount": 48000 },
    { "month": "2026-02", "amount": 62000 }
  ]
}
```

---

## 6. Mobile Application

### 6.1 Navigation Architecture

```
RootNavigator (Stack)
│
├── [isOnboarded = false]
│   ├── SplashScreen             (auto-navigate after 2.5s)
│   └── OnboardingScreen         (3 slides, AsyncStorage flag)
│
├── [isAuthenticated = false]
│   ├── RegisterScreen
│   └── OTPVerifyScreen
│
├── [locationSetup = false]
│   └── LocationSetupScreen
│
└── [isAuthenticated = true]
    ├── MainTabNavigator (Bottom Tabs)
    │   ├── Tab: HomeScreen           (🏠)
    │   ├── Tab: SearchScreen         (🔍)
    │   ├── Tab: EnrollmentsScreen    (📅)
    │   └── Tab: ProfileScreen        (👤)
    │
    ├── AcademyDetailScreen      (presentation: slide-from-bottom)
    ├── SlotsScreen
    ├── SlotConfirmScreen        (Step 1/4)
    ├── TransportOptionScreen    (Step 2/4)
    ├── PaymentScreen            (Step 3/4)
    ├── BookingSuccessScreen     (Step 4/4, gestureEnabled: false, fade)
    └── TransitTrackingScreen    (presentation: slide-from-bottom)
```

### 6.2 Screen Specifications

#### SplashScreen
- Trophy icon with spring-scale animation (from 0.3 → 1.0, tension 40)
- App name "SportsHub" fade in at 300ms delay
- Tagline "Discover • Enroll • Train" at 600ms
- Auto-navigate to Onboarding at 2500ms via `useEffect`
- Checks `AsyncStorage` for onboarding flag before navigating

#### OnboardingScreen
| Slide | Title | Subtitle | Theme |
|---|---|---|---|
| 1 | Discover Academies | Find the best sports academies near you | Teal `#0D9488` |
| 2 | Enroll Instantly | Book your preferred time slots and start training | Navy `#1E3A5F` |
| 3 | Track Your Ride | Real-time transport tracking for safe commute | Green `#10B981` |

- Animated dot indicators: active dot width 24px, inactive 8px (`Animated.timing`)
- Skip button top-right skips to RegisterScreen
- "Get Started" on last slide, "Next" on others

#### RegisterScreen
- Fields: Full Name, Email, Phone (+91 prefix, 10-digit numeric)
- Validation: All required, email regex, phone ≥ 10 digits
- Social login: Google / Apple UI placeholders (non-functional in v1)
- On submit: `POST /api/auth/register` → store tokens in authStore → navigate to OTPVerify

#### OTPVerifyScreen
- 6 `TextInput` refs linked: `ref[i]` auto-focuses `ref[i+1]` on value entry
- Backspace: clears current → focuses previous
- Auto-submit when all 6 filled
- 30-second countdown → "Resend OTP" activates
- Dev hint shown: "For demo, enter any 6 digits"

#### LocationSetupScreen
- "Use Current Location": `expo-location` `requestForegroundPermissionsAsync()` → `getCurrentPositionAsync()` → `reverseGeocodeAsync()`
- Manual: `TextInput` for city/area, geocoded on submit
- Fallback: Hyderabad (`17.385044, 78.486671`) if permission denied
- Saves to `authStore.setLocation(lat, lng, address)`

#### HomeScreen
- Header: `Good morning, {firstName}` | location name | notification bell (badge count)
- Sport category chips (horizontal `FlatList`, 8 categories)
- **Featured Academies** (`rating >= 4.7`): horizontal `FlatList`, snap-to-item
  - Card: primary photo, name, verified badge (✓), sport tag chips, ⭐ rating + review count, distance badge, transport badge
- **Near You**: vertical `FlatList` sorted by distance ASC
- Data: `useQuery(['academies', userLat, userLng], fetchAcademies)` — stale 5 min
- `RefreshControl` pull-to-refresh calls `queryClient.invalidateQueries`
- Graceful fallback to mock data on network error

#### SearchScreen
- Auto-focused `TextInput` with clear (✕) button
- Bottom sheet filter modal:
  - Sport multi-select chips (check toggle)
  - Rating selector: Any / 3+ / 3.5+ / 4+ / 4.5+
  - Transport toggle (`Switch`)
- Sort tabs: Distance (📍) | Rating (⭐) | Price (💰)
- Result `FlatList`: image + name + tags + rating + distance + price/month
- Empty state: search icon + "No academies found" message

#### AcademyDetailScreen
- Photo carousel: horizontal `FlatList` + dot indicators (absolute positioned)
- Address row: map pin icon + text + "Directions" → `Linking.openURL('maps://...')`
- Transport banner: teal highlight if `transportAvailable`
- Coaches: horizontal scroll of 80px avatar cards → opens `CoachDetailModal`
- Reviews: summary card → opens `ReviewsModal`
- Programs: vertical list, each with sport emoji, name, age range, fee, "View Slots" CTA

#### SlotsScreen
- Duration chips: 1 Month / 3 Months / 6 Months / 1 Year
- Morning band (05:30–08:30): 3 checkbox slots
- Evening band (15:30–18:30): 3 checkbox slots
- Multi-select: user can pick multiple slots
- Price summary: `feeMonthly × selectedSlots.length × durationMonths`
- Continue button disabled until ≥ 1 slot selected

#### SlotConfirmScreen (Step 1/4)
- Academy summary card
- Program card with sport emoji
- Selected slots list with Morning/Evening labels
- Price breakdown: fee per slot × slots × duration = subtotal
- "Available" badge confirmed via `GET /:programId/slots/:slotId/availability`
- Button: "Continue to Transport"

#### TransportOptionScreen (Step 2/4)

**If transport available:**
- Radio: "Add Transportation" vs "No Transport (Free)"
- Distance input: km (numeric keypad), live price update
- Pricing live display:
  ```
  ₹25/km × {distance} km × 2 (round trip) = ₹{daily}/day
  ₹{daily} × 26 days = ₹{monthly}/month
  ₹{monthly} × {durationMonths} months = ₹{total} total transport
  ```
- Pickup location: from `authStore.homeAddress` (editable)
- Feature chips: Verified drivers, Live tracking, Direct contact, On time

**If no transport:**
- Grey banner: "Transport service not available at this academy"

#### PaymentScreen (Step 3/4)
- Order summary card:
  - Training Fee: `₹{trainingFee}`
  - Transport Fee: `₹{transportFee}` (if opted)
  - **Total: `₹{totalAmount}`**
- Payment method radio group: UPI | Card | Net Banking | Wallet
- "Secured by Razorpay • 256-bit SSL" trust badge
- Payment flow:
  1. `POST /api/enrollments` → `enrollmentId`
  2. `POST /api/payments/initiate` → `{ orderId, key, amount }`
  3. `POST /api/payments/confirm` → `{ success: true }`
  4. Store `bookingId` → navigate to `BookingSuccessScreen`
  5. On any API error: simulate success + generate client-side booking ID (demo mode)

#### BookingSuccessScreen (Step 4/4)
- Spring-scale checkmark animation (0 → 1, damping 15)
- Booking ID card (monospace font)
- Academy name, program, slot times, total amount paid
- QR code SVG (booking ID as payload, 200×200 px)
- "Show at academy entrance"
- **Share via WhatsApp:**
  ```
  Linking.openURL(`whatsapp://send?text=I've booked ${programName} at ${academyName}!
  Booking ID: ${bookingId}. Starts ${slotTime}.`)
  ```
- Native Share: `Share.share({ message, title })`
- Done → `navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })`
- Clears `enrollmentStore`

#### EnrollmentsScreen
- Segmented tabs: Active (ACTIVE, PENDING) | Past (COMPLETED, CANCELLED)
- Enrollment card:
  - Academy name + program name
  - Status badge (color-coded: green=ACTIVE, amber=PENDING, gray=PAST)
  - Slot time + days of week
  - Transport chip if opted + "Track Live →" button
- Data: `useQuery(['enrollments/me'], fetchEnrollments)` — refetch on tab focus
- Empty state: sport emoji + "No enrollments yet" + "Explore Academies" button

#### ProfileScreen
- Avatar: colored circle with first letter (40px)
- User: name, email, phone
- Stats row: Enrollments | Academies | Rating
- Menu sections:
  - **Account:** Edit Profile, Payment History, Notifications
  - **Preferences:** Default Location, Language, Appearance
  - **Support:** Help & FAQ, Contact Support, Terms & Privacy
- Logout with `Alert.alert` confirmation → `authStore.logout()` → navigate to Register

#### TransitTrackingScreen
- LIVE badge (red dot, `Animated.loop` pulsing opacity 1→0.3)
- Map placeholder with bus 🚌, person 📍, flag 🏁 markers
- Progress stepper: Dispatched → Picking Up → En Route → Arrived
  - Active step: filled teal circle; completed: teal with ✓; pending: gray outline
- ETA card: `"Arrives at {time} · {eta} min remaining"`
- Driver card: name, vehicle number/color/model → `DriverDetailModal`
- 📞 Call button: `Linking.openURL('tel:+91XXXXXXXXXX')`
- Notification schedule accordion (9 items, collapsible)
- Share button: `Share.share({ message: 'sportshub://track/${enrollmentId}/${date}' })`

### 6.3 Reusable Components

| Component | File | Description |
|---|---|---|
| `AcademyCard` | `components/AcademyCard.tsx` | Used in HomeScreen and SearchScreen |
| `StatusBadge` | `components/StatusBadge.tsx` | Color-coded enrollment status |
| `SportChip` | `components/SportChip.tsx` | Tappable sport filter pill |
| `CoachCard` | `components/CoachCard.tsx` | Coach avatar + info |
| `SlotCheckbox` | `components/SlotCheckbox.tsx` | Slot selection checkbox row |
| `PriceBreakdown` | `components/PriceBreakdown.tsx` | Training + transport fee summary |
| `ProgressStepper` | `components/ProgressStepper.tsx` | Transit progress steps |
| `CoachDetailModal` | `components/CoachDetailModal.tsx` | Bottom sheet coach detail |
| `DriverDetailModal` | `components/DriverDetailModal.tsx` | Bottom sheet driver detail |
| `ReviewsModal` | `components/ReviewsModal.tsx` | Bottom sheet academy reviews |

### 6.4 State Management

#### Auth Store (Zustand + AsyncStorage persist)

```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isOnboarded: boolean
  locationSetup: boolean
  userLat: number | null
  userLng: number | null
  homeAddress: string | null

  setUser: (user: User) => void
  setTokens: (access: string, refresh: string) => void
  login: (user: User, access: string, refresh: string) => void
  logout: () => void
  setOnboarded: () => void
  setLocation: (lat: number, lng: number, address: string) => void
}
```

Persisted to `AsyncStorage` via `zustand/middleware/persist`.

#### Enrollment Store (Zustand, in-memory only)

```typescript
interface EnrollmentState {
  selectedAcademy: Academy | null
  selectedProgram: SportProgram | null
  selectedSlots: Slot[]
  durationMonths: number
  transportOpted: boolean
  pickupAddress: string | null
  pickupLat: number | null
  pickupLng: number | null
  pickupDistance: number

  setAcademy: (academy: Academy) => void
  setProgram: (program: SportProgram) => void
  setSlots: (slots: Slot[]) => void
  setDuration: (months: number) => void
  setTransport: (opted: boolean, address?: string, lat?: number, lng?: number, distance?: number) => void
  reset: () => void
}
```

### 6.5 API Service Layer

```typescript
// Base Axios instance
const api = axios.create({
  baseURL: __DEV__ ? 'http://10.0.2.2:3000/api' : 'https://sportshub-api.onrender.com/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — attach JWT
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — silent token refresh on 401
api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      const { refreshToken } = useAuthStore.getState()
      const { data } = await api.post('/auth/refresh', { refreshToken })
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
      return api(error.config)
    }
    if (error.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(error)
  }
)
```

---

## 7. Admin Dashboard

### 7.1 Technology

- **Next.js 14** with App Router and Server Components
- **Tailwind CSS** utility-first styling
- **Recharts** for revenue and enrollment trend charts
- Client-side data fetching with Axios (no SSR for admin pages — auth required)

### 7.2 Layout

```
AdminLayout
├── Sidebar (w-64, fixed left)
│   ├── Logo + "SportNexus Admin"
│   ├── Nav: Overview, Academies, Enrollments, Programs, Users, Transit, Payments
│   └── User avatar + logout
└── Main content area (flex-1, p-6)
```

### 7.3 Pages

#### Overview Page (`/`)
- 4 stat cards: Total Academies | Total Enrollments | Active Users | Revenue (₹)
- Enrollment trend chart (last 6 months, line chart)
- Revenue breakdown (bar chart by academy)
- Recent Enrollments table:
  | Column | Value |
  |---|---|
  | Student | Name + avatar |
  | Academy | Name |
  | Program | Name + sport emoji |
  | Date | Formatted date |
  | Status | Color-coded badge |

#### Academies Page (`/academies`)
- Search input (debounced 300ms)
- "Add Academy" button (modal form)
- Table: Name | Sport Type | Enrollment (`enrolled/capacity`) | Rating | Verified | Actions

#### Enrollments Page (`/enrollments`)
- Status filter tabs: All | Active | Pending | Cancelled
- Sortable table with pagination

---

## 8. Real-Time Features

### 8.1 Socket.IO Architecture

```
Mobile Client (Student)              Transport Operator (Driver App)
       │                                          │
       │ emit('join-transit', sessionId)          │ emit('driver-location', payload)
       ▼                                          ▼
   ┌─────────────────────────────────────────────────┐
   │              Fastify + Socket.IO Server          │
   │                                                  │
   │  io.on('driver-location', async ({ sessionId,   │
   │    lat, lng, eta, status }) => {                │
   │    // 1. Update DB (TransitSession)              │
   │    await prisma.transitSession.update(...)       │
   │    // 2. Broadcast to room                       │
   │    io.to(`transit:${sessionId}`)                │
   │       .emit('location-update', { lat, lng, eta })│
   │  })                                              │
   └─────────────────────────────────────────────────┘
```

### 8.2 Socket.IO Events

#### Client → Server

| Event | Payload | Server Action |
|---|---|---|
| `join-transit` | `{ sessionId: string }` | `socket.join('transit:' + sessionId)` |
| `driver-location` | `{ sessionId, lat, lng, eta, status }` | Update DB + broadcast to room |
| `transit-status` | `{ sessionId, status }` | Update DB status + broadcast to room |
| `leave-transit` | `{ sessionId: string }` | `socket.leave('transit:' + sessionId)` |

#### Server → Client

| Event | Payload | When Emitted |
|---|---|---|
| `location-update` | `{ lat, lng, eta, status }` | On every driver GPS update |
| `status-update` | `{ status, timestamp }` | On transit status change |
| `session-completed` | `{ sessionId }` | When status reaches COMPLETED |

### 8.3 Mobile Socket Hook

```typescript
function useTransitSocket(sessionId: string) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const [status, setStatus] = useState<TransitStatus>('SCHEDULED')

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socket.emit('join-transit', { sessionId })
    socket.on('location-update', ({ lat, lng, eta, status }) => {
      setLocation({ lat, lng })
      setEta(eta)
      setStatus(status)
    })
    return () => {
      socket.emit('leave-transit', { sessionId })
      socket.disconnect()
    }
  }, [sessionId])

  return { location, eta, status }
}
```

### 8.4 Transit Status Flow

```
SCHEDULED ──▶ DISPATCHED ──▶ ARRIVING ──▶ PICKED_UP ──▶ AT_ACADEMY ──▶ COMPLETED
   (T-30m)      (Departure)    (T-5min)     (Pickup)     (Academy)     (Return trip)
```

Each status change triggers:
1. DB update (`TransitSession.status`)
2. Socket.IO broadcast to `transit:{sessionId}` room
3. BullMQ job → FCM push notification to enrolled user

---

## 9. Authentication & Authorization

### 9.1 Registration & Login Flow

```
Mobile App
   │
   ├─[New User]──▶ POST /api/auth/register ──▶ Create User in DB
   │                                           ──▶ Return { user, accessToken, refreshToken }
   │
   ├─[OTP]──────▶ POST /api/auth/otp/verify ──▶ Validate OTP (dev: any 6 digits)
   │                                           ──▶ Return { user, accessToken, refreshToken }
   │
   └─[Location]──▶ PATCH /api/users/me ──────▶ Save homeLat, homeLng, homeAddress
```

### 9.2 Token Strategy

| Token | Algorithm | Expiry | Storage | Rotation |
|---|---|---|---|---|
| Access Token | HS256 | 15 minutes | Zustand memory | Rotated on every refresh |
| Refresh Token | HS256 | 30 days | Zustand + PostgreSQL (hashed) | Single-use, invalidated after rotation |

### 9.3 Silent Refresh Flow

```
1. API call → 401 Unauthorized
2. Axios interceptor: sets _retry = true
3. POST /api/auth/refresh { refreshToken }
4. Server: validates refresh token hash in DB
5. Server: issues new accessToken + refreshToken
6. Store new tokens → retry original request
7. On refresh failure → authStore.logout() → redirect to Register
```

### 9.4 Role-Based Access Control (RBAC)

```typescript
// Fastify route preHandler guard
async function requireRole(roles: UserRole[]) {
  return async (request: FastifyRequest) => {
    await request.jwtVerify()
    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError('Insufficient permissions')
    }
  }
}

// Usage
fastify.get('/api/admin/dashboard', {
  preHandler: requireRole(['ACADEMY_ADMIN', 'SUPER_ADMIN'])
}, dashboardHandler)
```

| Role | Academy Scope | Enrollment Scope | Analytics Scope |
|---|---|---|---|
| `USER` | Read-only (all) | Own only | None |
| `ACADEMY_ADMIN` | Full CRUD (own) | Own academy | Own academy |
| `SUPER_ADMIN` | Full CRUD (all) | All | Platform-wide |
| `TRANSPORT_OPERATOR` | Read (own routes) | None | None |

---

## 10. Payment System

### 10.1 Payment Flow

```
Client                         API Server                    Razorpay
  │                                │                              │
  ├─ POST /payments/initiate ──────▶                              │
  │                                ├─ Create Order ──────────────▶
  │                                │◀─────────────── { orderId } ─┤
  │◀── { orderId, key, amount } ───┤                              │
  │                                │                              │
  ├─ [User completes payment in Razorpay SDK UI]                  │
  │                                │                              │
  │                                │◀── Webhook: payment.captured ┤
  │                                ├─ Verify HMAC-SHA256          │
  │                                ├─ Payment → SUCCESS           │
  │                                └─ Enrollment → CONFIRMED      │
  │                                                               │
  ├─ POST /payments/confirm ───────▶ (fallback confirmation)      │
  │◀── { success: true } ──────────┤                              │
  │                                │                              │
  └─ Navigate to BookingSuccess    │                              │
```

### 10.2 Pricing Model

| Component | Formula | Example |
|---|---|---|
| Training Fee | `feeMonthly × slots × durationMonths` | ₹2000 × 2 slots × 3 months = ₹12,000 |
| Transport Fee | `distanceKm × 2 × ₹25 × 26 × durationMonths` | 5km × 2 × ₹25 × 26 × 3 = ₹19,500 |
| **Total** | Training + Transport | ₹31,500 |
| Razorpay Amount | Total × 100 (paise) | 3,150,000 paise |

### 10.3 Webhook Security

```typescript
import crypto from 'crypto'

function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  )
}
```

---

## 11. Transit & Transport Tracking

### 11.1 Transport Pricing

| Parameter | Value |
|---|---|
| Rate per km | ₹25 |
| Working days/month | 26 (Mon–Sat) |
| Trip type | Round trip (× 2) |
| Daily cost | `distance × 2 × ₹25` |
| Monthly cost | `dailyCost × 26` |
| Total cost | `monthlyCost × durationMonths` |

### 11.2 Daily Transit Session Creation

A BullMQ repeatable job runs at **05:00 IST daily**:
1. Find all CONFIRMED enrollments with `transportOpted = true`
2. For each enrollment, check if session exists for today
3. If not, create `TransitSession { status: SCHEDULED }`
4. Enqueue FCM notification: "Your transport is scheduled for today"

### 11.3 Tracking Features

| Feature | Implementation |
|---|---|
| Live GPS | Socket.IO room `transit:{sessionId}`, 5-second polling by driver app |
| ETA | Calculated server-side from driver location to pickup point (Haversine) |
| Progress stepper | 4 stages mapped from `TransitStatus` enum |
| Driver details | Fetched via `GET /api/transit/:id` on screen mount |
| Call driver | `Linking.openURL('tel:' + driverPhone)` |
| Share link | Deep link `sportshub://track/{enrollmentId}/{date}` via `Share.share()` |

### 11.4 Transit Status Lifecycle

| Status | Trigger | Notification |
|---|---|---|
| `SCHEDULED` | Daily BullMQ job | "Transport scheduled for today" |
| `DISPATCHED` | Operator event | "Your vehicle is on its way" |
| `ARRIVING` | Auto at ETA ≤ 10 min | "Vehicle arriving in {eta} minutes" |
| `PICKED_UP` | Operator event | "You've been picked up, en route to academy" |
| `AT_ACADEMY` | Operator event | "Arrived at the academy" |
| `COMPLETED` | Operator event | "You've reached home safely" |

---

## 12. Notification System

### 12.1 FCM Setup

```
API Server (Firebase Admin SDK)
    │
    ├─ Direct notification: sendEachForMulticast({ tokens, notification, data })
    │
    └─ BullMQ queue: notification-jobs
           │
           └─ Worker: processNotificationJob({ userId, type, data })
                  │
                  └─ Fetch user.fcmToken from DB
                     └─ firebaseAdmin.messaging().send(message)
```

### 12.2 Daily Transport Notifications (9 per session)

| # | Type | Timing | Message |
|---|---|---|---|
| 1 | `slot_reminder` | −60 min | "Your training session starts in 1 hour" |
| 2 | `vehicle_arriving` | −30 min | "Your vehicle is on its way" |
| 3 | `pickup_started` | −20 min | "Vehicle arriving at your pickup point" |
| 4 | `in_transit` | −15 min | "You're on your way to the academy" |
| 5 | `arrived` | −5 min | "Arriving at the academy in 5 minutes" |
| 6 | `return_vehicle_arriving` | +0 min (session end) | "Return vehicle is on its way" |
| 7 | `return_pickup` | +5 min | "Return pickup started" |
| 8 | `return_transit` | +10 min | "On your way back home" |
| 9 | `return_arrived` | +25 min | "You've reached home safely" |

### 12.3 BullMQ Notification Queue

```typescript
const notificationQueue = new Queue('notifications', { connection: redis })

// Enqueue with delay
await notificationQueue.add('transport', {
  userId, sessionId, type: 'slot_reminder', sessionTime
}, {
  delay: msUntilNotification,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 }
})

// Worker
const worker = new Worker('notifications', async (job) => {
  const { userId, type, sessionId } = job.data
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.fcmToken) return
  await firebaseAdmin.messaging().send({
    token: user.fcmToken,
    notification: { title: 'SportNexus', body: NOTIFICATION_MESSAGES[type] },
    data: { sessionId, type }
  })
}, { connection: redis })
```

---

## 13. Infrastructure & Deployment

### 13.1 Local Development (Docker Compose)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: sportnexus
      POSTGRES_USER: sportnexus
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

  api:
    build: ./apps/api
    ports: ["3000:3000"]
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: postgresql://sportnexus:password@postgres:5432/sportnexus
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-prod
      NODE_ENV: development

volumes:
  pgdata:
```

### 13.2 Cloud Deployment (Render)

| Service | Type | Plan | Config |
|---|---|---|---|
| `sportnexus-api` | Web Service (Node) | Starter | Build: `npm ci && prisma generate && prisma db push && tsc` · Start: `node apps/api/dist/index.js` |
| `sportnexus-redis` | Redis | Free | maxmemory-policy: allkeys-lru |
| `sportnexus-db` | PostgreSQL | Free | DB: sportnexus, User: sportnexus |

### 13.3 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | HS256 signing secret (≥ 32 chars) |
| `RAZORPAY_KEY_ID` | Yes | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook HMAC secret |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | JSON (base64 encoded) for FCM |
| `NODE_ENV` | Yes | `development` / `production` |
| `PORT` | No | Defaults to 3000 |

### 13.4 Mobile Build (EAS)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal"
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "simulator": false }
    }
  }
}
```

### 13.5 API URLs

| Environment | API Base | Socket URL |
|---|---|---|
| Development | `http://10.0.2.2:3000/api` | `http://10.0.2.2:3000` |
| Production | `https://sportshub-api.onrender.com/api` | `https://sportshub-api.onrender.com` |

---

## 14. Caching & Performance

### 14.1 Redis Caching Strategy

| Data | TTL | Invalidation |
|---|---|---|
| Academy list by city | 5 minutes | On academy update/create |
| Academy detail | 10 minutes | On academy update |
| Slot availability | 30 seconds | On enrollment create/cancel |
| User profile | 5 minutes | On profile update |

### 14.2 React Query (Mobile) Caching

| Query | Stale Time | Cache Time | Refetch |
|---|---|---|---|
| Academies list | 5 min | 30 min | On focus + pull-to-refresh |
| Academy detail | 10 min | 1 hour | On focus |
| Enrollments | 0 (always fresh) | 5 min | On tab focus |
| Transit session | 0 (real-time via socket) | 1 min | Socket replaces polling |

### 14.3 Database Indexes

All foreign keys are indexed. Additional composite indexes:
- `Academy(lat, lng)` — geo-range queries
- `Enrollment(userId, status)` — user enrollment list
- `TransitSession(enrollmentId, date)` — unique per enrollment per day
- `Payment(userId, status)` — payment history queries

---

## 15. Error Handling & Resilience

### 15.1 API Error Handling

```typescript
// Global Fastify error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode ?? 500
  fastify.log.error({ err: error, req: request.id }, error.message)
  reply.code(statusCode).send({
    success: false,
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'An unexpected error occurred' : error.message,
      statusCode
    }
  })
})
```

### 15.2 Mobile Resilience

- **Network timeout:** Axios timeout 10 seconds → show "Connection timeout" toast
- **Mock fallback:** On API error in HomeScreen/EnrollmentsScreen, render mock data with "Demo mode" banner
- **Offline state:** `NetInfo.addEventListener` detects offline → show offline banner
- **Empty states:** All lists have illustrated empty states with action CTAs
- **Payment demo fallback:** On any payment API error, simulate success + client-generated booking ID

### 15.3 BullMQ Retry Policy

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000      // 5s, 10s, 20s
  },
  removeOnComplete: 100,   // Keep last 100 completed jobs
  removeOnFail: 500        // Keep last 500 failed jobs for debugging
}
```

---

## 16. Security Architecture

### 16.1 Transport Layer

- All production traffic over HTTPS (TLS 1.2+)
- WebSocket connections upgrade from WSS
- Strict CORS: production restricts to known app origins

### 16.2 JWT Security

- Access tokens: 15-minute expiry (minimize exposure window)
- Refresh tokens: hashed with `bcrypt` before DB storage
- Single-use refresh tokens: rotated on every use

### 16.3 Payment Security

- Razorpay HMAC-SHA256 webhook signature verification
- `crypto.timingSafeEqual` prevents timing attacks in signature comparison
- Razorpay keys never exposed to mobile client (only `key_id`, never `key_secret`)

### 16.4 Input Validation

- All request bodies validated with Zod schemas before handler execution
- Fastify JSON schema serialization strips unknown fields from responses
- SQL injection: prevented by Prisma parameterized queries (no raw SQL)

### 16.5 Rate Limiting

```typescript
await fastify.register(rateLimit, {
  global: true,
  max: 100,                    // 100 requests per minute per IP
  timeWindow: '1 minute',
  redis: redisClient,
  errorResponseBuilder: () => ({
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests', statusCode: 429 }
  })
})
```

---

## 17. Observability & Monitoring

### 17.1 Structured Logging (Winston)

```json
{
  "level": "info",
  "timestamp": "2026-04-17T10:23:45.123Z",
  "requestId": "req-abc123",
  "method": "POST",
  "url": "/api/enrollments",
  "userId": "cuid123",
  "statusCode": 201,
  "responseTime": 45,
  "message": "Enrollment created"
}
```

### 17.2 Health Check Endpoint

```
GET /api/health
→ {
    "status": "ok",
    "version": "2.0.0",
    "timestamp": "2026-04-17T10:23:45Z",
    "services": {
      "database": "connected",
      "redis": "connected"
    }
  }
```

### 17.3 Key Metrics to Track

| Metric | Alert Threshold |
|---|---|
| API response time (p95) | > 500ms |
| Enrollment success rate | < 95% |
| Payment success rate | < 90% |
| Socket connection errors | > 50/min |
| BullMQ job failure rate | > 5% |
| Database connection pool exhaustion | Any |

---

## 18. Testing Strategy

### 18.1 API Testing (Jest + Supertest)

| Layer | Test Type | Coverage Target |
|---|---|---|
| Route handlers | Integration (real DB) | All P0 endpoints |
| Auth middleware | Unit | JWT verify, role guards |
| Payment webhook | Unit | HMAC verification |
| Enrollment transaction | Integration | Capacity check, duplicate check |
| Prisma service layer | Unit (mocked Prisma) | Business logic |

### 18.2 Mobile Testing (Jest + React Native Testing Library)

| Layer | Test Type | Coverage Target |
|---|---|---|
| Zustand stores | Unit | All state transitions |
| Utility functions | Unit | Haversine, currency, time format |
| API service layer | Unit (mocked Axios) | All API modules |
| Navigation flows | Integration | Auth flow, enrollment flow |

### 18.3 E2E Testing (Detox)

| Flow | Steps |
|---|---|
| Registration | Launch → Onboarding → Register → OTP → Location → Home |
| Enrollment | Home → Academy → Program → Slots → Confirm → Transport → Pay → Success |
| Transit | Enrollments → Track → Live map → Driver contact |

---

## 19. User Flows

### 19.1 Onboarding → Registration

```
App Launch
   │
   ▼ 2.5s
Onboarding (3 slides)
   │
   ▼ "Get Started"
Register (name / email / +91 phone)
   │
   ▼ API call
OTP Verify (6 digits, auto-submit)
   │
   ▼ Token stored
Location Setup (GPS or manual)
   │
   ▼ Location saved
Home Screen
```

### 19.2 Academy Discovery → Enrollment

```
Home / Search → Apply filters (sport / rating / transport / price)
   │
   ▼ Tap academy card
Academy Detail (carousel / coaches / reviews / programs)
   │
   ▼ "View Slots" on program
Slots Screen (select duration + time slots)
   │
   ▼ "Continue"
Step 1/4: Slot Confirm
   │
   ▼ "Continue to Transport"
Step 2/4: Transport Option (opt-in/out + distance input)
   │
   ▼ "Proceed to Payment"
Step 3/4: Payment (choose method → confirm)
   │
   ▼ API: enroll → initiate → confirm
Step 4/4: Booking Success (QR + share)
   │
   ▼ "Done"
Enrollments Tab
```

### 19.3 Transit Tracking

```
Enrollments Tab → Active enrollment card
   │
   ▼ "Track Live →"
Transit Tracking Screen
   │
   ├── Socket joins room `transit:{sessionId}`
   ├── Map updates every GPS ping
   ├── Progress stepper advances with status
   ├── ETA card refreshes
   └── FCM notifications throughout pickup → drop → return
```

### 19.4 Payment

```
Payment Screen
   │
   ├── POST /api/enrollments → { enrollmentId }
   ├── POST /api/payments/initiate → { orderId, key, amount }
   ├── Razorpay SDK handles UPI/Card/NetBanking
   ├── POST /api/payments/confirm → { success }
   └── Navigate to BookingSuccessScreen
```

---

## 20. Shared Packages

### 20.1 `@sportnexus/types`

```typescript
// Key interfaces exported
export interface User { id: string; name: string; email: string; phone: string; role: UserRole; ... }
export interface Academy { id: string; name: string; lat: number; lng: number; rating: number; ... }
export interface SportProgram { id: string; academyId: string; sportType: string; feeMonthly: number; ... }
export interface Slot { id: string; programId: string; timeStart: string; timeEnd: string; daysOfWeek: string[]; ... }
export interface Enrollment { id: string; userId: string; slotId: string; status: EnrollmentStatus; ... }
export interface Payment { id: string; enrollmentId: string; amount: number; status: PaymentStatus; ... }
export interface TransitSession { id: string; enrollmentId: string; status: TransitStatus; ... }

export interface ApiResponse<T> { success: boolean; data: T; error?: ApiError }
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: { cursor: string | null; total: number; hasMore: boolean }
}
```

### 20.2 `@sportnexus/utils`

| Function | Signature | Description |
|---|---|---|
| `calculateDistance` | `(lat1, lng1, lat2, lng2) => number` | Haversine formula, result in km |
| `formatCurrency` | `(amount: number) => string` | `₹1,500` with Indian locale |
| `formatTime` | `(time: string) => string` | `"06:30"` → `"6:30 AM"` |
| `getAvailabilityPercent` | `(enrolled, total) => number` | `0–100` fill percentage |
| `getRemainingSeats` | `(enrolled, total) => number` | Available seats |
| `calculateTransportFee` | `(distanceKm, months) => number` | Full transport cost formula |
| `calculateTrainingFee` | `(feeMonthly, slots, months) => number` | Full training cost formula |

**Constants:**
```typescript
export const SPORT_ICONS: Record<string, string> = {
  Cricket: '🏏', Football: '⚽', Basketball: '🏀', Tennis: '🎾',
  Badminton: '🏸', Swimming: '🏊', Athletics: '🏃', Volleyball: '🏐',
  Kabaddi: '🤼', Gymnastics: '🤸'
}
export const SPORT_TYPES = Object.keys(SPORT_ICONS)
export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const TRANSPORT_RATE_PER_KM = 25
export const WORKING_DAYS_PER_MONTH = 26
```

### 20.3 `@sportnexus/db`

```typescript
// packages/db/index.ts
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error']
})
export * from '@prisma/client'
```

---

## 21. Seed Data

The seed script (`packages/db/prisma/seed.ts`) creates a reproducible development dataset:

### Users (6)

| Name | Role | Email | Phone |
|---|---|---|---|
| Test User | USER | user@sportshub.com | +919999999999 |
| Admin 1–5 | ACADEMY_ADMIN | admin{N}@sportshub.com | +9188888888X |

### Academies (5) — All in Hyderabad, India

| Academy | Location | Rating | Transport |
|---|---|---|---|
| Champions Cricket Academy | Banjara Hills | 4.8 ⭐ | ✅ Van |
| KickStart Football Club | Madhapur | 4.6 ⭐ | ✅ Bus |
| AquaZone Swimming Centre | Jubilee Hills | 4.9 ⭐ | ❌ |
| CourtSide Racquet Academy | Gachibowli | 4.5 ⭐ | ✅ Van |
| AllStars Multi-Sport Hub | Kondapur | 4.7 ⭐ | ❌ |

### Additional Seed Data

| Entity | Count | Notes |
|---|---|---|
| Sport Programs | 15 | Cricket (3), Football (3), Swimming (3), Tennis (2), Badminton (1), Basketball (1), Weekend (2) |
| Slots | 25 | Realistic morning/evening timings, varied capacity |
| Coaches | 10 | Bios, sport tags, experience years, certifications |
| Academy Photos | 15 | Unsplash URLs (3 per academy), 1 primary per academy |
| Transport Routes | 3 | Champions, KickStart, CourtSide with Van/Bus details |

---

## 22. Future Roadmap

### v1.1 (Q3 2026)
- [ ] Review & rating submission from enrolled users
- [ ] Coach profile pages with availability calendar
- [ ] SMS OTP via Twilio (replace demo OTP)
- [ ] Enrollment cancellation refund flow (Razorpay refund API)

### v1.2 (Q4 2026)
- [ ] In-app chat (coach ↔ student) via Stream Chat SDK
- [ ] iOS APNs push notification support
- [ ] Advanced analytics dashboard (cohort analysis, churn rate)
- [ ] Multi-city expansion beyond Hyderabad

### v2.0 (2027)
- [ ] AI-powered academy recommendation engine
- [ ] Group booking (family enrollment)
- [ ] Subscription-based pricing model
- [ ] Partner mobile app for transport operators (dedicated driver app)
- [ ] Native iOS deep linking with Universal Links

---

## Appendix A: Design System

| Property | Value |
|---|---|
| **Primary Color** | `#0D9488` (Deep Teal) |
| **Accent Color** | `#10B981` (Emerald Green) |
| **Secondary Color** | `#1E3A5F` (Navy Blue) |
| **Danger Color** | `#EF4444` (Red) |
| **Warning Color** | `#F59E0B` (Amber) |
| **Success Color** | `#10B981` (Green) |
| **Background** | `#F9FAFB` (Gray 50) |
| **Surface** | `#FFFFFF` (White) |
| **Text Primary** | `#111827` (Gray 900) |
| **Text Secondary** | `#6B7280` (Gray 500) |
| **Font Style** | System default (San Francisco / Roboto) |
| **Icon Library** | Ionicons (via `@expo/vector-icons`) |
| **Border Radius** | 8px (cards), 12px (modals), 999px (chips) |
| **Shadow** | `0 1px 3px rgba(0,0,0,0.12)` |

---

## Appendix B: API Quick Reference

```
AUTH
  POST /api/auth/register
  POST /api/auth/otp/verify
  POST /api/auth/login
  POST /api/auth/refresh
  POST /api/auth/logout              🔒

USERS
  GET  /api/users/me                 🔒
  PATCH /api/users/me                🔒
  GET  /api/users/me/enrollments     🔒

ACADEMIES
  GET  /api/academies
  GET  /api/academies/:id
  GET  /api/academies/:id/programs

PROGRAMS
  GET  /api/programs/:id/slots
  GET  /api/programs/:id/slots/:slotId/availability

ENROLLMENTS
  POST /api/enrollments              🔒
  GET  /api/enrollments/me           🔒
  GET  /api/enrollments/:id          🔒
  DELETE /api/enrollments/:id        🔒

PAYMENTS
  POST /api/payments/initiate        🔒
  POST /api/payments/webhook
  POST /api/payments/confirm         🔒

TRANSIT
  GET  /api/transit/today            🔒
  GET  /api/transit/:id              🔒
  POST /api/transit
  PATCH /api/transit/:id/status

ADMIN
  GET  /api/admin/dashboard          🔒 (ACADEMY_ADMIN | SUPER_ADMIN)
  POST /api/admin/academies          🔒 (SUPER_ADMIN | ACADEMY_ADMIN)
  PATCH /api/admin/academies/:id     🔒 (ACADEMY_ADMIN | SUPER_ADMIN)
  PATCH /api/admin/slots/:id         🔒 (ACADEMY_ADMIN | SUPER_ADMIN)
  GET  /api/admin/enrollments        🔒 (ACADEMY_ADMIN | SUPER_ADMIN)
  GET  /api/admin/revenue            🔒 (ACADEMY_ADMIN | SUPER_ADMIN)

HEALTH
  GET  /api/health

🔒 = JWT required
```
