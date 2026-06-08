-- =============================================================================
-- SportNexus — DDL Script
-- PostgreSQL 16
-- Generated from Prisma schema (packages/db/prisma/schema.prisma)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE "UserRole" AS ENUM (
  'USER',
  'ACADEMY_ADMIN',
  'SUPER_ADMIN',
  'TRANSPORT_OPERATOR'
);

CREATE TYPE "EnrollmentStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'ACTIVE',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE "TransitStatus" AS ENUM (
  'SCHEDULED',
  'DISPATCHED',
  'ARRIVING',
  'PICKED_UP',
  'AT_ACADEMY',
  'COMPLETED'
);

-- -----------------------------------------------------------------------------
-- TABLE: User
-- -----------------------------------------------------------------------------

CREATE TABLE "User" (
  "id"           VARCHAR NOT NULL,
  "name"         VARCHAR NOT NULL,
  "email"        VARCHAR NOT NULL,
  "phone"        VARCHAR NOT NULL,
  "dob"          TIMESTAMP(3),
  "profilePhoto" VARCHAR,
  "homeLat"      DOUBLE PRECISION,
  "homeLng"      DOUBLE PRECISION,
  "homeAddress"  VARCHAR,
  "role"         "UserRole"  NOT NULL DEFAULT 'USER',
  "firebaseUid"  VARCHAR,
  "refreshToken" VARCHAR,
  "fcmToken"     VARCHAR,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_email_key" UNIQUE ("email"),
  CONSTRAINT "User_phone_key" UNIQUE ("phone"),
  CONSTRAINT "User_firebaseUid_key" UNIQUE ("firebaseUid")
);

CREATE INDEX "User_email_idx" ON "User" ("email");
CREATE INDEX "User_phone_idx" ON "User" ("phone");

-- -----------------------------------------------------------------------------
-- TABLE: Academy
-- -----------------------------------------------------------------------------

CREATE TABLE "Academy" (
  "id"                 VARCHAR NOT NULL,
  "name"               VARCHAR NOT NULL,
  "description"        VARCHAR NOT NULL,
  "address"            VARCHAR NOT NULL,
  "city"               VARCHAR NOT NULL,
  "lat"                DOUBLE PRECISION NOT NULL,
  "lng"                DOUBLE PRECISION NOT NULL,
  "rating"             DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount"        INTEGER NOT NULL DEFAULT 0,
  "transportAvailable" BOOLEAN NOT NULL DEFAULT false,
  "phone"              VARCHAR,
  "email"              VARCHAR,
  "isVerified"         BOOLEAN NOT NULL DEFAULT false,
  "adminUserId"        VARCHAR,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Academy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Academy_adminUserId_fkey"
    FOREIGN KEY ("adminUserId") REFERENCES "User" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Academy_lat_lng_idx" ON "Academy" ("lat", "lng");
CREATE INDEX "Academy_city_idx"    ON "Academy" ("city");
CREATE INDEX "Academy_rating_idx"  ON "Academy" ("rating");

-- -----------------------------------------------------------------------------
-- TABLE: AcademyPhoto
-- -----------------------------------------------------------------------------

CREATE TABLE "AcademyPhoto" (
  "id"        VARCHAR NOT NULL,
  "academyId" VARCHAR NOT NULL,
  "url"       VARCHAR NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "altText"   VARCHAR,

  CONSTRAINT "AcademyPhoto_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AcademyPhoto_academyId_fkey"
    FOREIGN KEY ("academyId") REFERENCES "Academy" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AcademyPhoto_academyId_idx" ON "AcademyPhoto" ("academyId");

-- -----------------------------------------------------------------------------
-- TABLE: Coach
-- -----------------------------------------------------------------------------

CREATE TABLE "Coach" (
  "id"              VARCHAR NOT NULL,
  "academyId"       VARCHAR NOT NULL,
  "name"            VARCHAR NOT NULL,
  "photo"           VARCHAR,
  "sportTags"       TEXT[]  NOT NULL DEFAULT '{}',
  "experienceYears" INTEGER NOT NULL,
  "bio"             VARCHAR,
  "certifications"  TEXT[]  NOT NULL DEFAULT '{}',
  "isActive"        BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "Coach_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Coach_academyId_fkey"
    FOREIGN KEY ("academyId") REFERENCES "Academy" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Coach_academyId_idx" ON "Coach" ("academyId");

-- -----------------------------------------------------------------------------
-- TABLE: SportProgram
-- -----------------------------------------------------------------------------

CREATE TABLE "SportProgram" (
  "id"             VARCHAR NOT NULL,
  "academyId"      VARCHAR NOT NULL,
  "sportType"      VARCHAR NOT NULL,
  "name"           VARCHAR NOT NULL,
  "description"    VARCHAR,
  "ageGroupMin"    INTEGER NOT NULL DEFAULT 5,
  "ageGroupMax"    INTEGER NOT NULL DEFAULT 60,
  "feeMonthly"     DOUBLE PRECISION NOT NULL,
  "durationMonths" INTEGER NOT NULL DEFAULT 1,
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SportProgram_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SportProgram_academyId_fkey"
    FOREIGN KEY ("academyId") REFERENCES "Academy" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SportProgram_academyId_idx"  ON "SportProgram" ("academyId");
CREATE INDEX "SportProgram_sportType_idx"  ON "SportProgram" ("sportType");

-- -----------------------------------------------------------------------------
-- TABLE: Slot
-- -----------------------------------------------------------------------------

CREATE TABLE "Slot" (
  "id"            VARCHAR NOT NULL,
  "programId"     VARCHAR NOT NULL,
  "timeStart"     VARCHAR NOT NULL,
  "timeEnd"       VARCHAR NOT NULL,
  "daysOfWeek"    TEXT[]  NOT NULL DEFAULT '{}',
  "totalCapacity" INTEGER NOT NULL,
  "enrolledCount" INTEGER NOT NULL DEFAULT 0,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "Slot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Slot_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "SportProgram" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Slot_programId_idx" ON "Slot" ("programId");

-- -----------------------------------------------------------------------------
-- TABLE: Enrollment
-- -----------------------------------------------------------------------------

CREATE TABLE "Enrollment" (
  "id"             VARCHAR NOT NULL,
  "userId"         VARCHAR NOT NULL,
  "slotId"         VARCHAR NOT NULL,
  "transportOpted" BOOLEAN  NOT NULL DEFAULT false,
  "pickupLat"      DOUBLE PRECISION,
  "pickupLng"      DOUBLE PRECISION,
  "pickupAddress"  VARCHAR,
  "pickupDistance" DOUBLE PRECISION,
  "durationMonths" INTEGER  NOT NULL DEFAULT 1,
  "status"         "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
  "enrolledAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"      TIMESTAMP(3),
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Enrollment_userId_slotId_key" UNIQUE ("userId", "slotId"),
  CONSTRAINT "Enrollment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_slotId_fkey"
    FOREIGN KEY ("slotId") REFERENCES "Slot" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Enrollment_userId_idx" ON "Enrollment" ("userId");
CREATE INDEX "Enrollment_slotId_idx" ON "Enrollment" ("slotId");
CREATE INDEX "Enrollment_status_idx" ON "Enrollment" ("status");

-- -----------------------------------------------------------------------------
-- TABLE: Payment
-- -----------------------------------------------------------------------------

CREATE TABLE "Payment" (
  "id"              VARCHAR NOT NULL,
  "userId"          VARCHAR NOT NULL,
  "enrollmentId"    VARCHAR NOT NULL,
  "amount"          DOUBLE PRECISION NOT NULL,
  "transportFee"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount"     DOUBLE PRECISION NOT NULL,
  "currency"        VARCHAR NOT NULL DEFAULT 'INR',
  "gateway"         VARCHAR NOT NULL DEFAULT 'razorpay',
  "gatewayOrderId"  VARCHAR,
  "gatewayTxnId"    VARCHAR,
  "status"          "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_enrollmentId_key"   UNIQUE ("enrollmentId"),
  CONSTRAINT "Payment_gatewayOrderId_key" UNIQUE ("gatewayOrderId"),
  CONSTRAINT "Payment_gatewayTxnId_key"   UNIQUE ("gatewayTxnId"),
  CONSTRAINT "Payment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payment_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Payment_userId_idx" ON "Payment" ("userId");
CREATE INDEX "Payment_status_idx" ON "Payment" ("status");

-- -----------------------------------------------------------------------------
-- TABLE: TransportRoute
-- -----------------------------------------------------------------------------

CREATE TABLE "TransportRoute" (
  "id"            VARCHAR NOT NULL,
  "academyId"     VARCHAR NOT NULL,
  "vehicleId"     VARCHAR NOT NULL,
  "driverId"      VARCHAR NOT NULL,
  "driverName"    VARCHAR NOT NULL,
  "driverPhone"   VARCHAR NOT NULL,
  "vehicleNumber" VARCHAR NOT NULL,
  "vehicleType"   VARCHAR NOT NULL DEFAULT 'Van',
  "isActive"      BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TransportRoute_academyId_fkey"
    FOREIGN KEY ("academyId") REFERENCES "Academy" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "TransportRoute_academyId_idx" ON "TransportRoute" ("academyId");

-- -----------------------------------------------------------------------------
-- TABLE: TransitSession
-- -----------------------------------------------------------------------------

CREATE TABLE "TransitSession" (
  "id"            VARCHAR NOT NULL,
  "enrollmentId"  VARCHAR NOT NULL,
  "date"          TIMESTAMP(3) NOT NULL,
  "status"        "TransitStatus" NOT NULL DEFAULT 'SCHEDULED',
  "driverLat"     DOUBLE PRECISION,
  "driverLng"     DOUBLE PRECISION,
  "etaMinutes"    INTEGER,
  "driverName"    VARCHAR,
  "driverPhone"   VARCHAR,
  "vehicleNumber" VARCHAR,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TransitSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TransitSession_enrollmentId_date_key" UNIQUE ("enrollmentId", "date"),
  CONSTRAINT "TransitSession_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "TransitSession_enrollmentId_idx" ON "TransitSession" ("enrollmentId");
CREATE INDEX "TransitSession_date_idx"         ON "TransitSession" ("date");

-- =============================================================================
-- END OF DDL
-- =============================================================================
