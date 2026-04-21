// ─── Constants ────────────────────────────────────────────────────────────────

export const TRANSPORT_RATE_PER_KM = 25
export const WORKING_DAYS_PER_MONTH = 26

export const SPORT_ICONS: Record<string, string> = {
  Cricket: '🏏',
  Football: '⚽',
  Basketball: '🏀',
  Tennis: '🎾',
  Badminton: '🏸',
  Swimming: '🏊',
  Athletics: '🏃',
  Volleyball: '🏐',
  Kabaddi: '🤼',
  Gymnastics: '🤸',
}

export const SPORT_TYPES = Object.keys(SPORT_ICONS)

export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  ACTIVE: 'Active',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export const TRANSIT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  DISPATCHED: 'Dispatched',
  ARRIVING: 'Arriving',
  PICKED_UP: 'Picked Up',
  AT_ACADEMY: 'At Academy',
  COMPLETED: 'Completed',
}

// ─── Geo ──────────────────────────────────────────────────────────────────────

/**
 * Haversine formula — returns distance in km between two GPS coordinates.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const aerialKm = R * c
  // Road correction factor: actual road distance is ~1.35× aerial in Indian cities
  return Math.round(aerialKm * 1.35 * 10) / 10
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Formats a number as Indian Rupees: ₹1,500
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Time ────────────────────────────────────────────────────────────────────

/**
 * Converts "HH:MM" 24-hour to "H:MM AM/PM"
 */
export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const minute = minuteStr
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minute} ${period}`
}

/**
 * Formats a slot time range: "6:30 AM – 7:30 AM"
 */
export function formatSlotTime(timeStart: string, timeEnd: string): string {
  return `${formatTime(timeStart)} – ${formatTime(timeEnd)}`
}

// ─── Slots ────────────────────────────────────────────────────────────────────

export function getAvailabilityPercent(enrolled: number, total: number): number {
  if (total === 0) return 0
  return Math.round((enrolled / total) * 100)
}

export function getRemainingSeats(enrolled: number, total: number): number {
  return Math.max(0, total - enrolled)
}

export function isSlotFull(enrolled: number, total: number): boolean {
  return enrolled >= total
}

export function isMorningSlot(timeStart: string): boolean {
  const hour = parseInt(timeStart.split(':')[0], 10)
  return hour < 12
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

/**
 * Training fee = feeMonthly × numberOfSlots × durationMonths
 */
export function calculateTrainingFee(
  feeMonthly: number,
  numberOfSlots: number,
  durationMonths: number
): number {
  return feeMonthly * numberOfSlots * durationMonths
}

/**
 * Transport fee = distance(km) × 2 (round trip) × ₹25/km × 26 days/month × durationMonths
 */
export function calculateTransportFee(
  distanceKm: number,
  durationMonths: number
): number {
  const daily = distanceKm * 2 * TRANSPORT_RATE_PER_KM
  const monthly = daily * WORKING_DAYS_PER_MONTH
  return monthly * durationMonths
}

export function calculateTotalFee(
  feeMonthly: number,
  numberOfSlots: number,
  durationMonths: number,
  transportOpted: boolean,
  distanceKm: number
): number {
  const training = calculateTrainingFee(feeMonthly, numberOfSlots, durationMonths)
  const transport = transportOpted ? calculateTransportFee(distanceKm, durationMonths) : 0
  return training + transport
}

// ─── Prorated Transport Fee ───────────────────────────────────────────────────

export interface TransportFeeBreakdownItem {
  label: string
  days: number
  fee: number
}

export interface TransportFeeBreakdown {
  items: TransportFeeBreakdownItem[]
  total: number
  endDate: Date
}

function countWorkingDays(start: Date, end: Date): number {
  let count = 0
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  while (d <= last) {
    if (d.getDay() !== 0) count++ // exclude Sundays
    d.setDate(d.getDate() + 1)
  }
  return count
}

/**
 * Prorated transport fee:
 * - First partial month: count Mon–Sat days from startDate to last day of that month
 * - Subsequent months: full calendar month Mon–Sat days
 * Returns per-month breakdown + total + endDate.
 */
export function calculateProratedTransportFee(
  startDate: Date,
  durationMonths: number,
  distanceKm: number
): TransportFeeBreakdown {
  const dailyRate = distanceKm * 2 * TRANSPORT_RATE_PER_KM
  const items: TransportFeeBreakdownItem[] = []
  const isFirstDayOfMonth = startDate.getDate() === 1

  for (let i = 0; i < durationMonths; i++) {
    const year  = startDate.getFullYear()
    const month = startDate.getMonth() + i

    let periodStart: Date
    let periodEnd: Date

    if (i === 0 && !isFirstDayOfMonth) {
      // Partial first month
      periodStart = new Date(startDate)
      periodEnd   = new Date(year, month + 1, 0) // last day of start month
    } else {
      // Full calendar month
      const absMonth = ((month % 12) + 12) % 12
      const absYear  = year + Math.floor(month / 12)
      periodStart = new Date(absYear, absMonth, 1)
      periodEnd   = new Date(absYear, absMonth + 1, 0)
    }

    const days = countWorkingDays(periodStart, periodEnd)
    const fee  = Math.round(days * dailyRate)

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

    const isPartial = i === 0 && !isFirstDayOfMonth
    const label = isPartial
      ? `${fmt(periodStart)} – ${fmt(periodEnd)} (partial)`
      : periodStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

    items.push({ label, days, fee })
  }

  const lastMonth  = startDate.getMonth() + durationMonths
  const endDate    = new Date(startDate.getFullYear(), lastMonth, 0)
  const total      = items.reduce((s, it) => s + it.fee, 0)

  return { items, total, endDate }
}
