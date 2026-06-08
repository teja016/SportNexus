# SportNexus — Data Model

## Overview

SportNexus uses PostgreSQL with 10 tables and 4 enums managed via Prisma ORM.
All primary keys are CUID strings. Timestamps are stored as UTC.

---

## Entity Relationship Summary

```
User ──────────────── Enrollment ──────── Payment
 │                        │
 │                        ├──────────── TransitSession
 │
 └── Academy (admin) ─── SportProgram ── Slot ── Enrollment
                      ├── AcademyPhoto
                      ├── Coach
                      └── TransportRoute
```

---

## Tables

### 1. User
Stores all app users — parents/students, academy admins, super admins, transport operators.

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| name | String | NOT NULL |
| email | String | UNIQUE, NOT NULL |
| phone | String | UNIQUE, NOT NULL |
| dob | DateTime | nullable |
| profilePhoto | String | nullable |
| homeLat | Float | nullable |
| homeLng | Float | nullable |
| homeAddress | String | nullable |
| role | UserRole enum | DEFAULT USER |
| firebaseUid | String | UNIQUE, nullable |
| refreshToken | String | nullable (bcrypt-hashed) |
| fcmToken | String | nullable |
| createdAt | DateTime | DEFAULT now() |
| updatedAt | DateTime | auto-updated |

**Indexes:** email, phone
**Relations:** enrollments (1:N), payments (1:N), academies (1:N via AcademyAdmin)

---

### 2. Academy
Sports academy listings with location, ratings, and contact details.

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| name | String | NOT NULL |
| description | String | NOT NULL |
| address | String | NOT NULL |
| city | String | NOT NULL |
| lat | Float | NOT NULL |
| lng | Float | NOT NULL |
| rating | Float | DEFAULT 0 |
| reviewCount | Int | DEFAULT 0 |
| transportAvailable | Boolean | DEFAULT false |
| phone | String | nullable |
| email | String | nullable |
| isVerified | Boolean | DEFAULT false |
| adminUserId | String | FK → User.id, nullable |
| createdAt | DateTime | DEFAULT now() |
| updatedAt | DateTime | auto-updated |

**Indexes:** (lat, lng) composite, city, rating
**Relations:** admin (N:1 User), photos (1:N), coaches (1:N), programs (1:N), transportRoutes (1:N)

---

### 3. AcademyPhoto
Photo gallery for each academy.

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| academyId | String | FK → Academy.id CASCADE DELETE |
| url | String | NOT NULL |
| isPrimary | Boolean | DEFAULT false |
| altText | String | nullable |

**Indexes:** academyId

---

### 4. Coach
Coaches attached to an academy.

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| academyId | String | FK → Academy.id CASCADE DELETE |
| name | String | NOT NULL |
| photo | String | nullable |
| sportTags | String[] | array |
| experienceYears | Int | NOT NULL |
| bio | String | nullable |
| certifications | String[] | array |
| isActive | Boolean | DEFAULT true |

**Indexes:** academyId

---

### 5. SportProgram
A sport offered by an academy (e.g. "Cricket Beginners", "Swimming Advanced").

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| academyId | String | FK → Academy.id CASCADE DELETE |
| sportType | String | NOT NULL (CRICKET, FOOTBALL, etc.) |
| name | String | NOT NULL |
| description | String | nullable |
| ageGroupMin | Int | DEFAULT 5 |
| ageGroupMax | Int | DEFAULT 60 |
| feeMonthly | Float | NOT NULL (INR per month) |
| durationMonths | Int | DEFAULT 1 |
| isActive | Boolean | DEFAULT true |
| createdAt | DateTime | DEFAULT now() |

**Indexes:** academyId, sportType
**Relations:** academy (N:1), slots (1:N)

---

### 6. Slot
A time slot within a program (e.g. Mon/Wed/Fri 6:00–7:00 AM, capacity 20).

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| programId | String | FK → SportProgram.id CASCADE DELETE |
| timeStart | String | NOT NULL (HH:MM format) |
| timeEnd | String | NOT NULL (HH:MM format) |
| daysOfWeek | String[] | array (MON, TUE, etc.) |
| totalCapacity | Int | NOT NULL |
| enrolledCount | Int | DEFAULT 0 |
| isActive | Boolean | DEFAULT true |

**Indexes:** programId
**Relations:** program (N:1), enrollments (1:N)

---

### 7. Enrollment
A user's booking of a specific slot in a program.

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| userId | String | FK → User.id |
| slotId | String | FK → Slot.id |
| transportOpted | Boolean | DEFAULT false |
| pickupLat | Float | nullable |
| pickupLng | Float | nullable |
| pickupAddress | String | nullable |
| pickupDistance | Float | nullable (km from academy) |
| durationMonths | Int | DEFAULT 1 |
| status | EnrollmentStatus | DEFAULT PENDING |
| enrolledAt | DateTime | DEFAULT now() |
| expiresAt | DateTime | nullable |
| updatedAt | DateTime | auto-updated |

**Unique:** (userId, slotId) — prevents duplicate enrollment
**Indexes:** userId, slotId, status
**Relations:** user (N:1), slot (N:1), payment (1:1 optional), transitSessions (1:N)

---

### 8. Payment
Payment record for an enrollment. One payment per enrollment.

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| userId | String | FK → User.id |
| enrollmentId | String | UNIQUE FK → Enrollment.id |
| amount | Float | training fee in INR |
| transportFee | Float | DEFAULT 0 |
| totalAmount | Float | amount + transportFee |
| currency | String | DEFAULT INR |
| gateway | String | DEFAULT razorpay |
| gatewayOrderId | String | UNIQUE, nullable (Razorpay order ID) |
| gatewayTxnId | String | UNIQUE, nullable (Razorpay txn ID) |
| status | PaymentStatus | DEFAULT PENDING |
| webhookVerified | Boolean | DEFAULT false |
| createdAt | DateTime | DEFAULT now() |
| updatedAt | DateTime | auto-updated |

**Indexes:** userId, status
**Relations:** user (N:1), enrollment (1:1)

---

### 9. TransportRoute
Driver + vehicle assigned to an academy for transport.

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| academyId | String | FK → Academy.id |
| vehicleId | String | NOT NULL |
| driverId | String | NOT NULL |
| driverName | String | NOT NULL |
| driverPhone | String | NOT NULL |
| vehicleNumber | String | NOT NULL |
| vehicleType | String | DEFAULT Van |
| isActive | Boolean | DEFAULT true |

**Indexes:** academyId
**Relations:** academy (N:1)

---

### 10. TransitSession
A single day's pickup/drop session for one enrolled student.

| Column | Type | Constraints |
|---|---|---|
| id | String (CUID) | PK |
| enrollmentId | String | FK → Enrollment.id |
| date | DateTime | NOT NULL (date of session) |
| status | TransitStatus | DEFAULT SCHEDULED |
| driverLat | Float | nullable (live GPS) |
| driverLng | Float | nullable (live GPS) |
| etaMinutes | Int | nullable |
| driverName | String | nullable |
| driverPhone | String | nullable |
| vehicleNumber | String | nullable |
| createdAt | DateTime | DEFAULT now() |
| updatedAt | DateTime | auto-updated |

**Unique:** (enrollmentId, date) — one session per enrollment per day
**Indexes:** enrollmentId, date
**Relations:** enrollment (N:1)

---

## Enums

| Enum | Values |
|---|---|
| UserRole | USER, ACADEMY_ADMIN, SUPER_ADMIN, TRANSPORT_OPERATOR |
| EnrollmentStatus | PENDING, CONFIRMED, ACTIVE, CANCELLED, EXPIRED |
| PaymentStatus | PENDING, SUCCESS, FAILED, REFUNDED |
| TransitStatus | SCHEDULED, DISPATCHED, ARRIVING, PICKED_UP, AT_ACADEMY, COMPLETED |

---

## Key Constraints & Business Rules

- A user cannot enroll in the same slot twice — enforced by UNIQUE(userId, slotId)
- Deleting an Academy cascades to Photos, Coaches, Programs → Slots (but Enrollments are protected)
- One payment per enrollment — enforced by UNIQUE enrollmentId on Payment
- One transit session per enrollment per day — enforced by UNIQUE(enrollmentId, date)
- Slot capacity is tracked via enrolledCount — incremented/decremented inside Prisma transactions
- refreshToken stored as bcrypt hash, never plain text
