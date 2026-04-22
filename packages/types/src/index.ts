// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ACADEMY_ADMIN' | 'SUPER_ADMIN' | 'TRANSPORT_OPERATOR' | 'DRIVER'
export type EnrollmentStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type TransitStatus = 'SCHEDULED' | 'DISPATCHED' | 'ARRIVING' | 'PICKED_UP' | 'AT_ACADEMY' | 'COMPLETED'

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  phone: string
  dob?: string | null
  profilePhoto?: string | null
  homeLat?: number | null
  homeLng?: number | null
  homeAddress?: string | null
  role: UserRole
  firebaseUid?: string | null
  fcmToken?: string | null
  createdAt: string
  updatedAt: string
}

export interface Academy {
  id: string
  name: string
  description: string
  address: string
  city: string
  lat: number
  lng: number
  rating: number
  reviewCount: number
  transportAvailable: boolean
  phone?: string | null
  email?: string | null
  isVerified: boolean
  adminUserId?: string | null
  createdAt: string
  updatedAt: string
  // Relations (optional, included on detail views)
  photos?: AcademyPhoto[]
  coaches?: Coach[]
  programs?: SportProgram[]
  transportRoutes?: TransportRoute[]
  reviews?: Review[]
  // Computed
  distance?: number
}

export interface AcademyPhoto {
  id: string
  academyId: string
  url: string
  isPrimary: boolean
  altText?: string | null
}

export interface Coach {
  id: string
  academyId: string
  name: string
  photo?: string | null
  sportTags: string[]
  experienceYears: number
  bio?: string | null
  certifications: string[]
  isActive: boolean
}

export interface SportProgram {
  id: string
  academyId: string
  sportType: string
  name: string
  description?: string | null
  ageGroupMin: number
  ageGroupMax: number
  feeMonthly: number
  durationMonths: number
  isActive: boolean
  createdAt: string
  // Relations
  slots?: Slot[]
  academy?: Pick<Academy, 'id' | 'name' | 'transportAvailable'>
}

export interface Slot {
  id: string
  programId: string
  timeStart: string
  timeEnd: string
  daysOfWeek: string[]
  totalCapacity: number
  enrolledCount: number
  isActive: boolean
  // Relations
  program?: SportProgram
}

export interface Enrollment {
  id: string
  userId: string
  slotId: string
  transportOpted: boolean
  pickupLat?: number | null
  pickupLng?: number | null
  pickupAddress?: string | null
  pickupDistance?: number | null
  durationMonths: number
  startDate?: string | null
  endDate?: string | null
  status: EnrollmentStatus
  enrolledAt: string
  expiresAt?: string | null
  updatedAt: string
  // Relations
  user?: Pick<User, 'id' | 'name' | 'phone'>
  slot?: Slot & { program?: SportProgram & { academy?: Academy } }
  payment?: Payment
  transitSessions?: TransitSession[]
}

export interface Payment {
  id: string
  userId: string
  enrollmentId: string
  amount: number
  transportFee: number
  totalAmount: number
  currency: string
  gateway: string
  gatewayOrderId?: string | null
  gatewayTxnId?: string | null
  status: PaymentStatus
  webhookVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface TransportRoute {
  id: string
  academyId: string
  vehicleId: string
  driverId: string
  driverName: string
  driverPhone: string
  vehicleNumber: string
  vehicleType: string
  isActive: boolean
}

export interface TransitSession {
  id: string
  enrollmentId: string
  date: string
  status: TransitStatus
  driverLat?: number | null
  driverLng?: number | null
  etaMinutes?: number | null
  driverName?: string | null
  driverPhone?: string | null
  vehicleNumber?: string | null
  createdAt: string
  updatedAt: string
  // Relations
  enrollment?: Enrollment
}

export interface Review {
  id: string
  userId: string
  academyId: string
  rating: number
  comment?: string | null
  createdAt: string
  updatedAt: string
  user?: Pick<User, 'id' | 'name'>
}

// ─── API Response Envelopes ───────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  statusCode: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    cursor: string | null
    total: number
    hasMore: boolean
    limit: number
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalEnrollments: number
  todayEnrollments: number
  activeSlots: number
  totalRevenue: number
  enrollmentsByStatus: Record<EnrollmentStatus, number>
  revenueByMonth: { month: string; amount: number }[]
}
