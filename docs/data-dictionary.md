# SportNexus — Data Dictionary

A column-level reference for every field in the database.

---

## User

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key. Auto-generated collision-resistant unique ID |
| name | VARCHAR | No | — | Full display name of the user |
| email | VARCHAR | No | — | Login email. Must be globally unique |
| phone | VARCHAR | No | — | Mobile number with country code e.g. +919999999999. Must be globally unique |
| dob | TIMESTAMP | Yes | NULL | Date of birth. Used for age-group filtering in programs |
| profilePhoto | VARCHAR | Yes | NULL | URL to profile photo (CDN or storage URL) |
| homeLat | FLOAT8 | Yes | NULL | Home location latitude. Set during onboarding for distance calculation |
| homeLng | FLOAT8 | Yes | NULL | Home location longitude |
| homeAddress | VARCHAR | Yes | NULL | Human-readable home address string |
| role | ENUM | No | USER | Access level. USER=parent/student, ACADEMY_ADMIN=manages one academy, SUPER_ADMIN=full access, TRANSPORT_OPERATOR=driver app |
| firebaseUid | VARCHAR | Yes | NULL | Firebase Auth UID for push notification targeting. Unique |
| refreshToken | VARCHAR | Yes | NULL | Bcrypt-hashed JWT refresh token (30-day expiry). NULL after logout |
| fcmToken | VARCHAR | Yes | NULL | Firebase Cloud Messaging device token for push notifications. Updated on every app launch |
| createdAt | TIMESTAMP | No | now() | Account creation timestamp (UTC) |
| updatedAt | TIMESTAMP | No | auto | Auto-updated on every row change |

---

## Academy

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key |
| name | VARCHAR | No | — | Academy display name e.g. "Hyderabad Cricket Academy" |
| description | VARCHAR | No | — | Long description shown on detail screen |
| address | VARCHAR | No | — | Full street address |
| city | VARCHAR | No | — | City name. Used for filtering e.g. "Hyderabad" |
| lat | FLOAT8 | No | — | Academy latitude. Used for Haversine distance calculation |
| lng | FLOAT8 | No | — | Academy longitude |
| rating | FLOAT8 | No | 0 | Average rating 0–5. Updated when reviews are submitted |
| reviewCount | INT4 | No | 0 | Total number of reviews received |
| transportAvailable | BOOLEAN | No | false | Whether the academy offers pickup/drop transport service |
| phone | VARCHAR | Yes | NULL | Academy contact phone number |
| email | VARCHAR | Yes | NULL | Academy contact email |
| isVerified | BOOLEAN | No | false | Whether the academy has been verified by SportNexus admin |
| adminUserId | VARCHAR | Yes | NULL | FK to User. The ACADEMY_ADMIN user who manages this academy |
| createdAt | TIMESTAMP | No | now() | Row creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Auto-updated on every row change |

---

## AcademyPhoto

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key |
| academyId | VARCHAR | No | — | FK to Academy. Cascades on delete |
| url | VARCHAR | No | — | Full URL to the photo (CDN hosted) |
| isPrimary | BOOLEAN | No | false | If true, this photo is shown as the main cover image |
| altText | VARCHAR | Yes | NULL | Accessibility alt text for the image |

---

## Coach

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key |
| academyId | VARCHAR | No | — | FK to Academy. Cascades on delete |
| name | VARCHAR | No | — | Coach full name |
| photo | VARCHAR | Yes | NULL | URL to coach profile photo |
| sportTags | VARCHAR[] | No | {} | Array of sports this coach teaches e.g. ["CRICKET", "FOOTBALL"] |
| experienceYears | INT4 | No | — | Years of coaching experience |
| bio | VARCHAR | Yes | NULL | Short biography shown on coach detail card |
| certifications | VARCHAR[] | No | {} | Array of certification names e.g. ["NCA Level 2", "BCCI Certified"] |
| isActive | BOOLEAN | No | true | Whether coach is currently active at the academy |

---

## SportProgram

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key |
| academyId | VARCHAR | No | — | FK to Academy. Cascades on delete |
| sportType | VARCHAR | No | — | Sport category e.g. CRICKET, FOOTBALL, SWIMMING, TENNIS, BADMINTON |
| name | VARCHAR | No | — | Program name e.g. "Cricket Beginners", "Swimming Advanced" |
| description | VARCHAR | Yes | NULL | Optional program description |
| ageGroupMin | INT4 | No | 5 | Minimum age for enrollment |
| ageGroupMax | INT4 | No | 60 | Maximum age for enrollment |
| feeMonthly | FLOAT8 | No | — | Monthly fee in INR for one slot |
| durationMonths | INT4 | No | 1 | Default enrollment duration in months |
| isActive | BOOLEAN | No | true | Whether the program is accepting new enrollments |
| createdAt | TIMESTAMP | No | now() | Row creation timestamp |

---

## Slot

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key |
| programId | VARCHAR | No | — | FK to SportProgram. Cascades on delete |
| timeStart | VARCHAR | No | — | Slot start time in HH:MM 24-hour format e.g. "06:00" |
| timeEnd | VARCHAR | No | — | Slot end time in HH:MM 24-hour format e.g. "07:30" |
| daysOfWeek | VARCHAR[] | No | {} | Days this slot runs e.g. ["MON", "WED", "FRI"] |
| totalCapacity | INT4 | No | — | Maximum number of students allowed in this slot |
| enrolledCount | INT4 | No | 0 | Current number of confirmed enrollments. Managed via transaction |
| isActive | BOOLEAN | No | true | Whether slot is open for new enrollments |

---

## Enrollment

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key |
| userId | VARCHAR | No | — | FK to User. The student/parent who enrolled |
| slotId | VARCHAR | No | — | FK to Slot. The specific time slot enrolled into |
| transportOpted | BOOLEAN | No | false | Whether the user opted for academy transport service |
| pickupLat | FLOAT8 | Yes | NULL | Pickup location latitude (set if transportOpted=true) |
| pickupLng | FLOAT8 | Yes | NULL | Pickup location longitude |
| pickupAddress | VARCHAR | Yes | NULL | Human-readable pickup address |
| pickupDistance | FLOAT8 | Yes | NULL | Distance in km from pickup point to academy. Used for transport fee calculation |
| durationMonths | INT4 | No | 1 | Enrollment duration in months selected by user (1/3/6/12) |
| status | ENUM | No | PENDING | Lifecycle status. PENDING=awaiting payment, CONFIRMED=paid, ACTIVE=attending, CANCELLED=withdrawn, EXPIRED=duration ended |
| enrolledAt | TIMESTAMP | No | now() | When the enrollment record was created |
| expiresAt | TIMESTAMP | Yes | NULL | When the enrollment expires (enrolledAt + durationMonths) |
| updatedAt | TIMESTAMP | No | auto | Auto-updated on every row change |

---

## Payment

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key |
| userId | VARCHAR | No | — | FK to User. Denormalized from enrollment for faster payment queries |
| enrollmentId | VARCHAR | No | — | FK to Enrollment. Unique — one payment per enrollment |
| amount | FLOAT8 | No | — | Training fee component in INR (paise/100) |
| transportFee | FLOAT8 | No | 0 | Transport fee component in INR |
| totalAmount | FLOAT8 | No | — | Total charged = amount + transportFee |
| currency | VARCHAR | No | INR | ISO currency code |
| gateway | VARCHAR | No | razorpay | Payment gateway used. Values: razorpay, upi, manual |
| gatewayOrderId | VARCHAR | Yes | NULL | Razorpay order ID returned at order creation. Unique |
| gatewayTxnId | VARCHAR | Yes | NULL | Razorpay payment/transaction ID from webhook. Unique |
| status | ENUM | No | PENDING | PENDING=order created, SUCCESS=payment captured, FAILED=declined, REFUNDED=money returned |
| webhookVerified | BOOLEAN | No | false | True only when status was set via HMAC-verified Razorpay webhook |
| createdAt | TIMESTAMP | No | now() | Order creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Auto-updated on every row change |

---

## TransportRoute

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | No | cuid() | Primary key |
| academyId | VARCHAR | No | — | FK to Academy |
| vehicleId | VARCHAR | No | — | Internal vehicle identifier |
| driverId | VARCHAR | No | — | Internal driver identifier |
| driverName | VARCHAR | No | — | Driver's full name shown to parents |
| driverPhone | VARCHAR | No | — | Driver mobile number for emergency contact |
| vehicleNumber | VARCHAR | No | — | Vehicle registration plate e.g. TS09AB1234 |
| vehicleType | VARCHAR | No | Van | Vehicle type e.g. Van, Auto, Bus |
| isActive | BOOLEAN | No | true | Whether this route is currently operational |

---

## TransitSession

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | VARCHAR (CUID) | PK | cuid() | Primary key |
| enrollmentId | VARCHAR | No | — | FK to Enrollment. Identifies which student's pickup this is |
| date | TIMESTAMP | No | — | Date of this transit session (time part is midnight UTC) |
| status | ENUM | No | SCHEDULED | SCHEDULED=not started, DISPATCHED=driver en route, ARRIVING=near pickup, PICKED_UP=student in vehicle, AT_ACADEMY=arrived, COMPLETED=session done |
| driverLat | FLOAT8 | Yes | NULL | Real-time driver latitude. Updated via Socket.IO every few seconds |
| driverLng | FLOAT8 | Yes | NULL | Real-time driver longitude |
| etaMinutes | INT4 | Yes | NULL | Estimated minutes until driver arrives at pickup point |
| driverName | VARCHAR | Yes | NULL | Copied from TransportRoute at session creation for quick access |
| driverPhone | VARCHAR | Yes | NULL | Copied from TransportRoute at session creation |
| vehicleNumber | VARCHAR | Yes | NULL | Copied from TransportRoute at session creation |
| createdAt | TIMESTAMP | No | now() | Session creation timestamp |
| updatedAt | TIMESTAMP | No | auto | Auto-updated on every row change |

---

## Enum Reference

### UserRole
| Value | Description |
|---|---|
| USER | Regular parent or student. Can browse, enroll, pay, track |
| ACADEMY_ADMIN | Manages a single academy — slots, enrollments, coaches |
| SUPER_ADMIN | Full platform access — all academies, all users, revenue |
| TRANSPORT_OPERATOR | Driver app user — updates transit status and GPS location |

### EnrollmentStatus
| Value | Description |
|---|---|
| PENDING | Enrollment created, payment not yet completed |
| CONFIRMED | Payment successful, enrollment active |
| ACTIVE | Student currently attending (manual or scheduled transition) |
| CANCELLED | Enrollment cancelled by user or admin. Slot count decremented |
| EXPIRED | Enrollment duration ended |

### PaymentStatus
| Value | Description |
|---|---|
| PENDING | Razorpay order created, user has not paid yet |
| SUCCESS | Payment captured — set via webhook or client confirm fallback |
| FAILED | Payment failed or declined by gateway/bank |
| REFUNDED | Amount refunded to user's source account |

### TransitStatus
| Value | Description |
|---|---|
| SCHEDULED | Session created for today, driver not yet dispatched |
| DISPATCHED | Driver has started the route |
| ARRIVING | Driver is within ~1 km of the pickup point |
| PICKED_UP | Student has been picked up, vehicle en route to academy |
| AT_ACADEMY | Vehicle has reached the academy |
| COMPLETED | Session closed for the day |
