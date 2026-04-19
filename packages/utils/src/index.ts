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
  return Math.round(R * c * 10) / 10
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
