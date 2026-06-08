# SportNexus — Complete Data Model Reference

> **Database:** PostgreSQL 16  
> **ORM:** Prisma  
> **Schema file:** `packages/db/prisma/schema.prisma`

---

## Table of Contents
1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Tables — Detailed Reference](#tables--detailed-reference)
   - [users](#1-users)
   - [academies](#2-academies)
   - [academy_photos](#3-academy_photos)
   - [coaches](#4-coaches)
   - [sport_programs](#5-sport_programs)
   - [slots](#6-slots)
   - [enrollments](#7-enrollments)
   - [payments](#8-payments)
   - [transport_routes](#9-transport_routes)
   - [transit_sessions](#10-transit_sessions)
   - [transit_passengers](#11-transit_passengers)
   - [reviews](#12-reviews)
3. [Enums Reference](#enums-reference)
4. [Relationships Reference](#relationships-reference)
5. [Feature → Table Mapping](#feature--table-mapping)
6. [Key Business Rules](#key-business-rules)

---

## Entity Relationship Diagram

```mermaid
erDiagram
    users {
        string id PK
        string name
        string email UK
        string phone UK
        datetime dob
        string profilePhoto
        float homeLat
        float homeLng
        string homeAddress
        string role
        string firebaseUid UK
        string refreshToken
        string fcmToken
        datetime createdAt
        datetime updatedAt
    }

    academies {
        string id PK
        string name
        string description
        string address
        string city
        float lat
        float lng
        float rating
        int reviewCount
        boolean transportAvailable
        string phone
        string email
        boolean isVerified
        string adminUserId FK
        datetime createdAt
        datetime updatedAt
    }

    academy_photos {
        string id PK
        string academyId FK
        string url
        boolean isPrimary
        string altText
    }

    coaches {
        string id PK
        string academyId FK
        string name
        string photo
        string[] sportTags
        int experienceYears
        string bio
        string[] certifications
        boolean isActive
    }

    sport_programs {
        string id PK
        string academyId FK
        string sportType
        string name
        string description
        int ageGroupMin
        int ageGroupMax
        float feeMonthly
        int durationMonths
        boolean isActive
        datetime createdAt
    }

    slots {
        string id PK
        string programId FK
        string timeStart
        string timeEnd
        string[] daysOfWeek
        int totalCapacity
        int enrolledCount
        int transportCapacity
        boolean isActive
    }

    enrollments {
        string id PK
        string userId FK
        string slotId FK
        boolean transportOpted
        float pickupLat
        float pickupLng
        string pickupAddress
        float pickupDistance
        int durationMonths
        datetime startDate
        datetime endDate
        string status
        datetime enrolledAt
        datetime expiresAt
        datetime updatedAt
    }

    payments {
        string id PK
        string userId FK
        string enrollmentId FK_UK
        float amount
        float transportFee
        float totalAmount
        string currency
        string gateway
        string gatewayOrderId UK
        string gatewayTxnId UK
        string status
        boolean webhookVerified
        datetime createdAt
        datetime updatedAt
    }

    transport_routes {
        string id PK
        string academyId FK
        string vehicleId
        string driverId
        string driverName
        string driverPhone
        string vehicleNumber
        string vehicleType
        boolean isActive
    }

    transit_sessions {
        string id PK
        string slotId FK
        datetime date
        string status
        float driverLat
        float driverLng
        int etaMinutes
        string driverName
        string driverPhone
        string vehicleNumber
        string driverUserId FK
        datetime cancelledAt
        datetime createdAt
        datetime updatedAt
    }

    transit_passengers {
        string id PK
        string sessionId FK
        string enrollmentId FK_UK
        int stopOrder
        string status
        datetime pickedUpAt
        datetime createdAt
    }

    reviews {
        string id PK
        string userId FK
        string academyId FK
        int rating
        string comment
        datetime createdAt
        datetime updatedAt
    }

    users ||--o{ enrollments      : "books"
    users ||--o{ payments         : "makes"
    users ||--o{ academies        : "manages"
    users ||--o{ reviews          : "writes"
    users ||--o{ transit_sessions : "drives"

    academies ||--o{ academy_photos    : "has"
    academies ||--o{ coaches           : "employs"
    academies ||--o{ sport_programs    : "offers"
    academies ||--o{ transport_routes  : "uses"
    academies ||--o{ reviews           : "receives"

    sport_programs ||--o{ slots : "defines"

    slots ||--o{ enrollments     : "filled by"
    slots ||--o{ transit_sessions: "scheduled for"

    enrollments ||--o| payments          : "paid via"
    enrollments ||--o| transit_passengers: "tracked as"

    transit_sessions ||--o{ transit_passengers: "carries"
```

---

## Tables — Detailed Reference

---

### 1. `users`

> Every person who interacts with SportNexus — students, parents, academy admins, drivers.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK, NOT NULL | cuid() — collision-resistant unique ID |
| `name` | `VARCHAR(255)` | NOT NULL | Full display name |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Login email |
| `phone` | `VARCHAR(20)` | UNIQUE, NOT NULL | Mobile number (with country code e.g. +91XXXXXXXXXX) |
| `dob` | `TIMESTAMP` | NULL | Date of birth — used for age verification in programs |
| `profilePhoto` | `TEXT` | NULL | URL or base64 of profile photo |
| `homeLat` | `FLOAT8` | NULL | Home latitude — used for distance-to-academy calc |
| `homeLng` | `FLOAT8` | NULL | Home longitude |
| `homeAddress` | `TEXT` | NULL | Human-readable home address text |
| `role` | `UserRole` | NOT NULL, DEFAULT `USER` | Access level — see Enums |
| `firebaseUid` | `VARCHAR(128)` | UNIQUE, NULL | Firebase Auth UID — for future OAuth/phone auth |
| `refreshToken` | `TEXT` | NULL | Hashed JWT refresh token (bcrypt). Cleared on logout |
| `fcmToken` | `TEXT` | NULL | Firebase Cloud Messaging token for push notifications |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT `now()` | Account creation time |
| `updatedAt` | `TIMESTAMP` | NOT NULL, auto-update | Last profile update |

**Indexes:** `idx_users_email (email)`, `idx_users_phone (phone)`

**Relations out:**
- → `enrollments` (1:N) — user's enrollment history
- → `payments` (1:N) — user's payment records
- → `academies` via `adminUserId` (0:N) — academies the user manages
- → `reviews` (1:N) — reviews written
- → `transit_sessions` via `driverUserId` (0:N) — sessions driven

---

### 2. `academies`

> Sports academies listed on the platform. The core discovery entity.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK, NOT NULL | cuid() |
| `name` | `VARCHAR(255)` | NOT NULL | Academy display name |
| `description` | `TEXT` | NOT NULL | Detailed description shown on detail page |
| `address` | `TEXT` | NOT NULL | Full street address |
| `city` | `VARCHAR(100)` | NOT NULL | City — used for search filtering |
| `lat` | `FLOAT8` | NOT NULL | Latitude for distance sorting |
| `lng` | `FLOAT8` | NOT NULL | Longitude for distance sorting |
| `rating` | `FLOAT8` | NOT NULL, DEFAULT `0` | Aggregate rating (0–5). Recalculated on each review |
| `reviewCount` | `INTEGER` | NOT NULL, DEFAULT `0` | Counter cache for review count |
| `transportAvailable` | `BOOLEAN` | NOT NULL, DEFAULT `false` | Whether pickup/drop is offered |
| `phone` | `VARCHAR(20)` | NULL | Contact phone |
| `email` | `VARCHAR(255)` | NULL | Contact email |
| `isVerified` | `BOOLEAN` | NOT NULL, DEFAULT `false` | Admin-verified badge |
| `adminUserId` | `VARCHAR(30)` | FK → users.id, NULL | Academy's admin user |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT `now()` | |
| `updatedAt` | `TIMESTAMP` | NOT NULL, auto-update | |

**Indexes:** `idx_academies_lat_lng (lat, lng)`, `idx_academies_city (city)`, `idx_academies_rating (rating)`

**Relations out:**
- → `academy_photos` (1:N) — gallery images
- → `coaches` (1:N) — coaching staff
- → `sport_programs` (1:N) — programs offered
- → `transport_routes` (1:N) — vehicle/route assignments
- → `reviews` (1:N) — user reviews received

---

### 3. `academy_photos`

> Image gallery for each academy. Multiple photos, one marked primary.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `academyId` | `VARCHAR(30)` | FK → academies.id, CASCADE DELETE | Parent academy |
| `url` | `TEXT` | NOT NULL | Image URL (CDN / Cloudinary / S3) |
| `isPrimary` | `BOOLEAN` | DEFAULT `false` | Primary/hero image used in cards |
| `altText` | `VARCHAR(255)` | NULL | Accessibility alt text |

**Index:** `idx_academy_photos_academyid (academyId)`

---

### 4. `coaches`

> Coaching staff profiles displayed on the academy detail page.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `academyId` | `VARCHAR(30)` | FK → academies.id, CASCADE DELETE | |
| `name` | `VARCHAR(255)` | NOT NULL | Coach full name |
| `photo` | `TEXT` | NULL | Profile photo URL |
| `sportTags` | `TEXT[]` | NOT NULL | Array of sports e.g. `['Cricket','Batting']` |
| `experienceYears` | `INTEGER` | NOT NULL | Years of coaching experience |
| `bio` | `TEXT` | NULL | Short biography |
| `certifications` | `TEXT[]` | NOT NULL | Certification strings e.g. `['BCCI Level 2']` |
| `isActive` | `BOOLEAN` | DEFAULT `true` | Hidden from UI when false |

**Index:** `idx_coaches_academyid (academyId)`

---

### 5. `sport_programs`

> Training programs within an academy — e.g. "Cricket Batting Basics (Ages 8-14)".

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `academyId` | `VARCHAR(30)` | FK → academies.id, CASCADE DELETE | |
| `sportType` | `VARCHAR(50)` | NOT NULL | e.g. `Cricket`, `Football`, `Swimming` |
| `name` | `VARCHAR(255)` | NOT NULL | Program display name |
| `description` | `TEXT` | NULL | Program details |
| `ageGroupMin` | `INTEGER` | DEFAULT `5` | Minimum age for enrollment |
| `ageGroupMax` | `INTEGER` | DEFAULT `60` | Maximum age for enrollment |
| `feeMonthly` | `DECIMAL(10,2)` | NOT NULL | Monthly fee in INR (base fee per slot per month) |
| `durationMonths` | `INTEGER` | DEFAULT `1` | Minimum enrollment duration |
| `isActive` | `BOOLEAN` | DEFAULT `true` | Hidden from UI when false |
| `createdAt` | `TIMESTAMP` | DEFAULT `now()` | |

**Indexes:** `idx_sport_programs_academyid (academyId)`, `idx_sport_programs_sporttype (sportType)`

**Relations out:**
- → `slots` (1:N) — time slots under this program

---

### 6. `slots`

> Individual training time slots under a program — e.g. "Monday/Wednesday 7:00–8:30 AM".

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `programId` | `VARCHAR(30)` | FK → sport_programs.id, CASCADE DELETE | |
| `timeStart` | `VARCHAR(10)` | NOT NULL | HH:MM format e.g. `"07:00"` |
| `timeEnd` | `VARCHAR(10)` | NOT NULL | HH:MM format e.g. `"08:30"` |
| `daysOfWeek` | `TEXT[]` | NOT NULL | e.g. `['MONDAY','WEDNESDAY','FRIDAY']` |
| `totalCapacity` | `INTEGER` | NOT NULL | Max students enrolled in this slot |
| `enrolledCount` | `INTEGER` | DEFAULT `0` | Live counter — incremented on enrollment, decremented on cancel |
| `transportCapacity` | `INTEGER` | DEFAULT `20` | Max students who can opt for transport pickup |
| `isActive` | `BOOLEAN` | DEFAULT `true` | Hides slot from booking UI |

**Index:** `idx_slots_programid (programId)`

**Capacity check logic:** Before enrollment, API verifies `enrolledCount < totalCapacity`. Uses `SELECT … FOR UPDATE` in a transaction to prevent race conditions.

**Relations out:**
- → `enrollments` (1:N)
- → `transit_sessions` (1:N) — one session per slot per day

---

### 7. `enrollments`

> The core booking record — links a user to a specific slot for a duration.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `userId` | `VARCHAR(30)` | FK → users.id, NOT NULL | Student/user who enrolled |
| `slotId` | `VARCHAR(30)` | FK → slots.id, NOT NULL | Time slot booked |
| `transportOpted` | `BOOLEAN` | DEFAULT `false` | Whether user wants pickup/drop |
| `pickupLat` | `FLOAT8` | NULL | GPS lat of pickup point |
| `pickupLng` | `FLOAT8` | NULL | GPS lng of pickup point |
| `pickupAddress` | `TEXT` | NULL | Human-readable pickup address |
| `pickupDistance` | `FLOAT8` | NULL | Distance from pickup to academy in km (pre-calculated) |
| `durationMonths` | `INTEGER` | DEFAULT `1` | How many months enrolled (1/3/6/12) |
| `startDate` | `TIMESTAMP` | NULL | Training start date (chosen by user) |
| `endDate` | `TIMESTAMP` | NULL | Calculated: startDate + durationMonths |
| `status` | `EnrollmentStatus` | DEFAULT `PENDING` | See Enums |
| `enrolledAt` | `TIMESTAMP` | DEFAULT `now()` | When enrollment record was created |
| `expiresAt` | `TIMESTAMP` | NULL | Auto-cancel deadline (10 min from creation if no payment) |
| `updatedAt` | `TIMESTAMP` | auto-update | |

**Unique constraint:** `(userId, slotId)` — one active enrollment per user per slot

**Indexes:** `idx_enrollments_userid (userId)`, `idx_enrollments_slotid (slotId)`, `idx_enrollments_status (status)`

**Status flow:**
```
PENDING → CONFIRMED (on payment success)
PENDING → EXPIRED   (payment not received within 10 min)
CONFIRMED → ACTIVE  (after startDate passes)
CONFIRMED → CANCELLED (user cancels)
ACTIVE → CANCELLED  (user cancels)
ACTIVE → EXPIRED    (after endDate)
```

**Relations out:**
- → `payments` (1:1) — payment record for this enrollment
- → `transit_passengers` (1:1) — linked when transport is active

---

### 8. `payments`

> Payment record for each enrollment. One payment per enrollment.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `userId` | `VARCHAR(30)` | FK → users.id | |
| `enrollmentId` | `VARCHAR(30)` | FK → enrollments.id, UNIQUE | One payment per enrollment |
| `amount` | `DECIMAL(10,2)` | NOT NULL | Training fee (INR) |
| `transportFee` | `DECIMAL(10,2)` | DEFAULT `0` | Transport fee component (INR) |
| `totalAmount` | `DECIMAL(10,2)` | NOT NULL | `amount + transportFee` (INR) |
| `currency` | `VARCHAR(10)` | DEFAULT `'INR'` | Always INR |
| `gateway` | `VARCHAR(50)` | DEFAULT `'razorpay'` | Payment gateway used |
| `gatewayOrderId` | `VARCHAR(100)` | UNIQUE, NULL | Razorpay `order_id` |
| `gatewayTxnId` | `VARCHAR(100)` | UNIQUE, NULL | Razorpay `payment_id` / UPI ref |
| `status` | `PaymentStatus` | DEFAULT `PENDING` | See Enums |
| `webhookVerified` | `BOOLEAN` | DEFAULT `false` | `true` only after HMAC webhook verification |
| `createdAt` | `TIMESTAMP` | DEFAULT `now()` | |
| `updatedAt` | `TIMESTAMP` | auto-update | |

**Indexes:** `idx_payments_userid (userId)`, `idx_payments_status (status)`

**Fee calculation:**
- `amount` = `feeMonthly × slots × durationMonths`
- `transportFee` = `pickupDistance × 2 × ₹25 × workingDays` (prorated for first month, Sundays excluded)
- `totalAmount` = `amount + transportFee`

---

### 9. `transport_routes`

> Pre-configured vehicle and driver assignments per academy.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `academyId` | `VARCHAR(30)` | FK → academies.id | Which academy this route serves |
| `vehicleId` | `VARCHAR(100)` | NOT NULL | Internal vehicle identifier |
| `driverId` | `VARCHAR(100)` | NOT NULL | Internal driver identifier |
| `driverName` | `VARCHAR(255)` | NOT NULL | Driver display name |
| `driverPhone` | `VARCHAR(20)` | NOT NULL | Contact phone |
| `vehicleNumber` | `VARCHAR(20)` | NOT NULL | License plate e.g. `TS09AB1234` |
| `vehicleType` | `VARCHAR(50)` | DEFAULT `'Van'` | Vehicle type |
| `isActive` | `BOOLEAN` | DEFAULT `true` | |

**Index:** `idx_transport_routes_academyid (academyId)`

---

### 10. `transit_sessions`

> One session per slot per day — tracks the live pickup run.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `slotId` | `VARCHAR(30)` | FK → slots.id, NOT NULL | Which slot this session is for |
| `date` | `TIMESTAMP` | NOT NULL | The calendar date of this run (midnight UTC) |
| `status` | `TransitStatus` | DEFAULT `SCHEDULED` | See Enums |
| `driverLat` | `FLOAT8` | NULL | Live driver latitude (updated via Socket.IO) |
| `driverLng` | `FLOAT8` | NULL | Live driver longitude |
| `etaMinutes` | `INTEGER` | NULL | Estimated minutes to next stop |
| `driverName` | `VARCHAR(255)` | NULL | Assigned driver name |
| `driverPhone` | `VARCHAR(20)` | NULL | Driver contact |
| `vehicleNumber` | `VARCHAR(20)` | NULL | Vehicle license plate |
| `driverUserId` | `VARCHAR(30)` | FK → users.id, NULL | Driver's user account (optional) |
| `cancelledAt` | `TIMESTAMP` | NULL | When cancelled |
| `createdAt` | `TIMESTAMP` | DEFAULT `now()` | |
| `updatedAt` | `TIMESTAMP` | auto-update | |

**Unique constraint:** `(slotId, date)` — exactly one session per slot per day

**Indexes:** `idx_transit_sessions_slotid (slotId)`, `idx_transit_sessions_date (date)`, `idx_transit_sessions_driveruserid (driverUserId)`

**Created by:** BullMQ cron job at 23:30 UTC (05:00 IST) for the next day's slots, or manually via `POST /transit/generate-today`

**Relations out:**
- → `transit_passengers` (1:N) — each student in the run

---

### 11. `transit_passengers`

> Maps each enrolled student to a transit session with their stop order and real-time status.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `sessionId` | `VARCHAR(30)` | FK → transit_sessions.id, CASCADE DELETE | Parent session |
| `enrollmentId` | `VARCHAR(30)` | FK → enrollments.id, UNIQUE | Linked enrollment |
| `stopOrder` | `INTEGER` | NOT NULL | Pickup order (1 = first stop). Computed by nearest-neighbor algorithm on `pickupLat/Lng` |
| `status` | `PassengerStatus` | DEFAULT `WAITING` | See Enums |
| `pickedUpAt` | `TIMESTAMP` | NULL | Timestamp when driver marked as picked up |
| `createdAt` | `TIMESTAMP` | DEFAULT `now()` | |

**Indexes:** `idx_transit_passengers_sessionid (sessionId)`, `idx_transit_passengers_enrollmentid (enrollmentId)`

**Stop order calculation:** Nearest-neighbor greedy TSP from academy outward — passengers sorted by proximity to academy using Haversine distance.

---

### 12. `reviews`

> User reviews and ratings for academies. One review per user per academy.

| Column | PG Type | Constraints | Description |
|--------|---------|-------------|-------------|
| `id` | `VARCHAR(30)` | PK | |
| `userId` | `VARCHAR(30)` | FK → users.id, NOT NULL | Reviewer |
| `academyId` | `VARCHAR(30)` | FK → academies.id, CASCADE DELETE, NOT NULL | Academy reviewed |
| `rating` | `INTEGER` | NOT NULL | 1–5 stars |
| `comment` | `TEXT` | NULL | Optional text review |
| `createdAt` | `TIMESTAMP` | DEFAULT `now()` | |
| `updatedAt` | `TIMESTAMP` | auto-update | |

**Unique constraint:** `(userId, academyId)` — one review per user per academy (upsert on re-review)

**Side effect on POST/PATCH:** Recalculates `academies.rating` and `academies.reviewCount` using `AVG(rating)` over all reviews for that academy.

---

## Enums Reference

### `UserRole`
| Value | Who uses it | Access level |
|-------|-------------|--------------|
| `USER` | Students, parents | Can enroll, view own data, track transport |
| `ACADEMY_ADMIN` | Academy managers | Can manage their academy, view their enrollments/revenue |
| `SUPER_ADMIN` | Platform owner | Full access to all academies and data |
| `TRANSPORT_OPERATOR` | Transport managers | Can manage transit sessions and routes |
| `DRIVER` | Van/bus drivers | Can update driver location and passenger status |

### `EnrollmentStatus`
| Value | Meaning | Next states |
|-------|---------|-------------|
| `PENDING` | Created, awaiting payment (10-min window) | → CONFIRMED, EXPIRED, CANCELLED |
| `CONFIRMED` | Payment received | → ACTIVE, CANCELLED |
| `ACTIVE` | Training in progress (startDate passed) | → CANCELLED, EXPIRED |
| `CANCELLED` | Cancelled by user | Terminal |
| `EXPIRED` | Payment window missed OR enrollment duration ended | Terminal |

### `PaymentStatus`
| Value | Meaning |
|-------|---------|
| `PENDING` | Order created, waiting for payment |
| `SUCCESS` | Payment captured (webhook or confirm endpoint) |
| `FAILED` | Payment attempt failed |
| `REFUNDED` | Refund issued |

### `TransitStatus`
| Value | Meaning |
|-------|---------|
| `SCHEDULED` | Session created, driver not yet dispatched |
| `DISPATCHED` | Driver started the route |
| `ARRIVING` | Driver near next pickup point |
| `PICKED_UP` | All passengers picked up, en route to academy |
| `AT_ACADEMY` | Arrived at academy |
| `COMPLETED` | Run complete |
| `CANCELLED_BY_USER` | User cancelled today's pickup |

### `PassengerStatus`
| Value | Meaning |
|-------|---------|
| `WAITING` | At pickup point, not yet in vehicle |
| `PICKED_UP` | In vehicle |
| `ABSENT` | Marked absent by driver |

---

## Relationships Reference

| From Table | Relation | To Table | FK Column | Cascade | Cardinality |
|------------|----------|----------|-----------|---------|-------------|
| `academies` | belongs to | `users` | `adminUserId` | — | N:1 |
| `academy_photos` | belongs to | `academies` | `academyId` | DELETE | N:1 |
| `coaches` | belongs to | `academies` | `academyId` | DELETE | N:1 |
| `sport_programs` | belongs to | `academies` | `academyId` | DELETE | N:1 |
| `slots` | belongs to | `sport_programs` | `programId` | DELETE | N:1 |
| `enrollments` | belongs to | `users` | `userId` | — | N:1 |
| `enrollments` | belongs to | `slots` | `slotId` | — | N:1 |
| `payments` | belongs to | `users` | `userId` | — | N:1 |
| `payments` | belongs to | `enrollments` | `enrollmentId` | — | 1:1 |
| `transport_routes` | belongs to | `academies` | `academyId` | — | N:1 |
| `transit_sessions` | belongs to | `slots` | `slotId` | — | N:1 |
| `transit_sessions` | driven by | `users` | `driverUserId` | — | N:1 (optional) |
| `transit_passengers` | belongs to | `transit_sessions` | `sessionId` | DELETE | N:1 |
| `transit_passengers` | references | `enrollments` | `enrollmentId` | — | 1:1 |
| `reviews` | written by | `users` | `userId` | — | N:1 |
| `reviews` | about | `academies` | `academyId` | DELETE | N:1 |

---

## Feature → Table Mapping

### 🔐 Authentication (Login / OTP / Registration)
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| Register new user | `users` | INSERT: `name, email, phone, role` |
| Send OTP | `users` | READ: `phone` to find user |
| Verify OTP | `users` | UPDATE: `refreshToken` (hashed); RETURN: JWT tokens |
| Refresh token | `users` | READ + UPDATE: `refreshToken` |
| Logout | `users` | UPDATE: `refreshToken = NULL` |

---

### 🔍 Academy Discovery / Home Screen
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| List academies (Home) | `academies`, `academy_photos`, `sport_programs` | `lat, lng` for distance; `transportAvailable`, `rating` for filters |
| Search academies | `academies` | `name` ILIKE, `city`, `sportType` join via programs |
| Filter by sport | `academies` → `sport_programs` | `sportType` |
| Filter by transport | `academies` | `transportAvailable = true` |
| Filter by rating | `academies` | `rating >= X` |
| Filter by distance/radius | `academies` | `lat, lng` (Haversine in JS after fetch) |
| Sort by nearest | `academies` | `lat, lng` + client-side sort |

---

### 🏟️ Academy Detail Page
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| Academy info | `academies` | all columns |
| Photo gallery | `academy_photos` | `url, isPrimary` |
| Coach list | `coaches` | all columns |
| Program list | `sport_programs` | `sportType, name, feeMonthly, ageGroupMin, ageGroupMax` |
| Slot availability | `slots` | `timeStart, timeEnd, daysOfWeek, totalCapacity, enrolledCount, transportCapacity` |
| Reviews | `reviews` → `users` | `rating, comment, createdAt, user.name` |

---

### 📋 Enrollment Booking Flow (5 screens)
| Screen | Tables | Key Columns |
|--------|--------|-------------|
| **SlotsScreen** | `slots`, `sport_programs` | `timeStart, timeEnd, daysOfWeek, totalCapacity, enrolledCount` |
| **SlotConfirmScreen** | `slots`, `sport_programs`, `academies` | Availability check: `enrolledCount < totalCapacity` |
| **TransportOptionScreen** | `enrollments` (future), `academies` | `pickupLat, pickupLng, pickupDistance` calculation |
| **PaymentScreen** | `enrollments`, `payments` | CREATE enrollment: all enrollment columns; CREATE payment: `amount, transportFee, totalAmount, gatewayOrderId` |
| **BookingSuccessScreen** | `enrollments`, `payments` | READ final status |

**Enrollment creation transaction:**
```sql
BEGIN;
  SELECT id FROM slots WHERE id = $slotId FOR UPDATE;
  -- Check: enrolledCount < totalCapacity → else 409 SLOT_FULL
  -- Check: NOT EXISTS enrollment WHERE userId=$userId AND slotId=$slotId → else 409 DUPLICATE_ENROLLMENT
  INSERT INTO enrollments (...) VALUES (...);
  UPDATE slots SET enrolledCount = enrolledCount + 1 WHERE id = $slotId;
COMMIT;
```

---

### 📅 My Enrollments Screen
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| List all enrollments | `enrollments` → `slots` → `sport_programs` → `academies` | `status, startDate, endDate, durationMonths, transportOpted` |
| Enrollment payment info | `enrollments` → `payments` | `amount, transportFee, totalAmount, status` |
| Tab: Active | `enrollments` | `status IN ('PENDING','CONFIRMED','ACTIVE')` |
| Tab: Completed | `enrollments` | `status = 'EXPIRED'` |
| Tab: Cancelled | `enrollments` | `status = 'CANCELLED'` |
| Cancel enrollment | `enrollments`, `slots` | UPDATE `status = CANCELLED`; UPDATE `slots.enrolledCount - 1` |

---

### 📄 Enrollment Detail Page
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| Schedule info | `slots` | `timeStart, timeEnd, daysOfWeek` |
| Duration & dates | `enrollments` | `durationMonths, startDate, endDate` |
| Program info | `sport_programs` | `sportType, name, feeMonthly, ageGroupMin, ageGroupMax` |
| Academy location | `academies` | `address, lat, lng` |
| Pickup location | `enrollments` | `pickupAddress, pickupLat, pickupLng, pickupDistance` |
| Payment breakdown | `payments` | `amount (training), transportFee, totalAmount, status, gateway` |
| Live tracking button | `enrollments` | `status = 'CONFIRMED' AND transportOpted = true` |

---

### 🚌 Live Transit Tracking
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| Get today's session | `transit_sessions` → `transit_passengers` → `enrollments` | `date = today, slotId` match via enrollment |
| Driver location (Socket) | `transit_sessions` | `driverLat, driverLng, etaMinutes` (live update) |
| Session status | `transit_sessions` | `status` (SCHEDULED → DISPATCHED → ARRIVING → PICKED_UP → AT_ACADEMY → COMPLETED) |
| My stop | `transit_passengers` | `stopOrder, status, pickedUpAt` |
| Pickup address | `enrollments` | `pickupAddress, pickupLat, pickupLng` |
| Academy destination | `slots` → `sport_programs` → `academies` | `academies.address, lat, lng` |
| Driver info | `transit_sessions` | `driverName, driverPhone, vehicleNumber` |
| Cancel today's transport | `transit_sessions` | UPDATE `status = CANCELLED_BY_USER, cancelledAt = now()` |

**Socket.IO room:** `transit:{sessionId}` — emits `location-update`, `status-update`, `passenger-update`

---

### 👤 Profile Screen
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| Display profile | `users` | `name, email, phone, profilePhoto, role, dob` |
| Activity stats | `enrollments` | COUNT by status |
| Unique academies | `enrollments` → `slots` → `sport_programs` → `academies` | DISTINCT `academyId` |

---

### ✏️ Edit Profile
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| Update name/DOB | `users` | `name, dob` |
| Update photo | `users` | `profilePhoto` (URL) |
| Update home location | `users` | `homeLat, homeLng, homeAddress` |
| FCM token update | `users` | `fcmToken` (updated on each app launch) |

---

### ⭐ Reviews
| Operation | Tables | Key Columns |
|-----------|--------|-------------|
| Write/update review | `reviews` | UPSERT on `(userId, academyId)`: `rating, comment` |
| Recalculate rating | `academies` | UPDATE `rating = AVG`, `reviewCount = COUNT` |
| Show reviews | `reviews` → `users` | `rating, comment, createdAt, user.name, user.profilePhoto` |

---

### 🛠️ Admin Dashboard
| Metric | Tables | Query |
|--------|--------|-------|
| Total enrollments | `enrollments` | COUNT (scoped by academy admin) |
| Today's enrollments | `enrollments` | COUNT WHERE `enrolledAt >= today` |
| Active slots | `slots` | COUNT WHERE `isActive = true AND enrolledCount > 0` |
| Total revenue | `payments` | SUM `totalAmount` WHERE `status = 'SUCCESS'` |
| Enrollments by status | `enrollments` | GROUP BY `status` |
| Revenue by month | `payments` | GROUP BY `DATE_TRUNC('month', createdAt)` — split into training vs transport |
| User list | `users` | All with role, enrollmentCount |
| Academy management | `academies`, `sport_programs`, `slots` | CRUD |

---

### 🔔 Push Notifications
| Trigger event | Tables read | FCM payload |
|---------------|-------------|-------------|
| Enrollment confirmed | `enrollments`, `users` | "Your booking is confirmed!" |
| Transport dispatched | `transit_sessions`, `transit_passengers`, `enrollments`, `users` | "Driver has started. ETA: X min" |
| Driver arriving | `transit_sessions`, `users` | "Driver is 5 minutes away" |
| Driver at pickup | `transit_passengers`, `users` | "Driver is outside your location" |

**FCM token column:** `users.fcmToken` — updated via `PATCH /users/me { fcmToken }` on each app launch.

---

## Key Business Rules

| Rule | Tables Involved | Enforcement |
|------|-----------------|-------------|
| One enrollment per user per slot | `enrollments` | UNIQUE constraint `(userId, slotId)` + API `409 DUPLICATE_ENROLLMENT` |
| Slot capacity enforced | `slots.totalCapacity` vs `slots.enrolledCount` | SELECT FOR UPDATE in transaction + API `409 SLOT_FULL` |
| Payment window (10 min) | `enrollments.expiresAt` | BullMQ delayed job sets status → EXPIRED |
| Transport distance fee | `enrollments.pickupDistance`, `payments.transportFee` | `₹25/km × 2 × Mon-Sat days`, Sundays excluded |
| One transit session per slot per day | `transit_sessions` | UNIQUE constraint `(slotId, date)` |
| One review per user per academy | `reviews` | UNIQUE constraint `(userId, academyId)` — upsert on re-review |
| Rating is live aggregate | `academies.rating`, `reviews` | Recalculated on every review INSERT/UPDATE/DELETE |
| Webhook is authoritative for payment | `payments.webhookVerified` | Only webhook sets `webhookVerified = true`; `/confirm` is fallback only |
| Slot count decremented on cancel | `slots.enrolledCount` | Transaction: UPDATE slots SET enrolledCount - 1 on enrollment cancel |
