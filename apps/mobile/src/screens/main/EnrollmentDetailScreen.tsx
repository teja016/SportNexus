import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native'
import { MotiView } from 'moti'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { useQueryClient } from '@tanstack/react-query'
import { Enrollment } from '@sportnexus/types'
import { formatCurrency, formatSlotTime } from '@sportnexus/utils'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { enrollmentAPI } from '../../services/api'
import WriteReviewSheet from '../../components/WriteReviewSheet'

const STATUS_COLOR: Record<string, string> = {
  PENDING:   '#F59E0B',
  CONFIRMED: Colors.primary,
  ACTIVE:    Colors.accent,
  CANCELLED: Colors.danger,
  COMPLETED: '#6B7280',
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  )
}

export default function EnrollmentDetailScreen({ route, navigation }: any) {
  const { enrollments, removeEnrollment, updateEnrollment } = useLocalEnrollmentsStore()
  const queryClient = useQueryClient()
  const [showReview, setShowReview] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  // Accept either a full enrollment object (from EnrollmentsScreen) or just an ID (from BookingSuccess)
  const routeEnrollment: Enrollment =
    route.params?.enrollment ??
    enrollments.find((e) => e.id === route.params?.enrollmentId)
  // Prefer local store payment (has prorated transport fee)
  const localMatch = enrollments.find((e) => e.id === routeEnrollment?.id)
  const enrollment: Enrollment = routeEnrollment
    ? localMatch && (localMatch as any).payment
      ? { ...routeEnrollment, payment: (localMatch as any).payment, startDate: localMatch.startDate ?? (routeEnrollment as any).startDate, endDate: localMatch.endDate ?? (routeEnrollment as any).endDate } as Enrollment
      : routeEnrollment
    : routeEnrollment

  if (!enrollment) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="alert-circle-outline" size={40} color={Colors.textMuted} />
      <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Enrollment not found</Text>
    </View>
  )

  const academy = (enrollment as any).slot?.program?.academy
  const program = (enrollment as any).slot?.program
  const slot    = (enrollment as any).slot
  const payment = (enrollment as any).payment
  const bookingRef = enrollment.id?.slice(-8).toUpperCase() ?? '—'
  const statusColor = STATUS_COLOR[enrollment.status] ?? Colors.textMuted

  const slotTime = slot ? formatSlotTime(slot.timeStart, slot.timeEnd) : '—'
  const days = (slot?.daysOfWeek ?? []).map((d: string) => d.slice(0, 3)).join(', ') || '—'
  const enrolledDate = enrollment.enrolledAt
    ? new Date(enrollment.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const startDateStr = enrollment.startDate
    ? new Date(enrollment.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const endDateStr = enrollment.endDate
    ? new Date(enrollment.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : enrollment.startDate
    ? (() => {
        const end = new Date(enrollment.startDate!)
        end.setMonth(end.getMonth() + enrollment.durationMonths)
        return end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      })()
    : '—'

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <LinearGradient colors={['#1AAFC9', '#1C2E4A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.academyIconWrap}>
            <Text style={{ fontSize: 28 }}>🏟️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.academyName}>{academy?.name ?? 'Academy'}</Text>
            <Text style={styles.programName}>{program?.name ?? '—'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={[styles.statusText, { color: '#fff' }]}>{enrollment.status}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Booking Reference */}
      <MotiView from={{ opacity: 0, translateY: 20, scale: 0.97 }} animate={{ opacity: 1, translateY: 0, scale: 1 }} transition={{ type: 'spring', delay: 80, damping: 18, stiffness: 150 }}>
      <View style={styles.bookingCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookingLabel}>Booking Reference</Text>
          <Text style={styles.bookingId}>#{bookingRef}</Text>
          <Text style={styles.bookingDate}>Enrolled on {enrolledDate}</Text>
        </View>
        <QRCode
          value={`sportnexus://enrollment/${enrollment.id}`}
          size={80}
          color={Colors.navy}
          backgroundColor="#fff"
        />
      </View>
      </MotiView>

      {/* Schedule */}
      <MotiView from={{ opacity: 0, translateY: 24 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 160, damping: 18, stiffness: 150 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.card}>
          <Row icon="time-outline"     label="Slot Time"  value={slotTime} />
          <View style={styles.divider} />
          <Row icon="calendar-outline" label="Days"       value={days} />
          <View style={styles.divider} />
          <Row icon="hourglass-outline" label="Duration"  value={`${enrollment.durationMonths} month${enrollment.durationMonths > 1 ? 's' : ''}`} />
          {startDateStr !== '—' && (
            <>
              <View style={styles.divider} />
              <Row icon="play-circle-outline" label="Start Date" value={startDateStr} />
            </>
          )}
          {endDateStr !== '—' && (
            <>
              <View style={styles.divider} />
              <Row icon="stop-circle-outline" label="End Date"   value={endDateStr} />
            </>
          )}
        </View>
      </View>
      </MotiView>

      {/* Program */}
      <MotiView from={{ opacity: 0, translateY: 24 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 240, damping: 18, stiffness: 150 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Program</Text>
        <View style={styles.card}>
          <Row icon="barbell-outline"  label="Sport"      value={program?.sportType ?? '—'} />
          <View style={styles.divider} />
          <Row icon="people-outline"   label="Age Group"  value={program ? `${program.ageGroupMin}–${program.ageGroupMax} years` : '—'} />
          <View style={styles.divider} />
          <Row icon="cash-outline"     label="Monthly Fee" value={program ? formatCurrency(program.feeMonthly) : '—'} />
        </View>
      </View>
      </MotiView>

      {/* Location */}
      {(academy?.address || enrollment.pickupAddress) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            {academy?.address && (
              <Row icon="business-outline" label="Academy Address" value={academy.address} />
            )}
            {academy?.address && enrollment.pickupAddress && (
              <View style={styles.divider} />
            )}
            {enrollment.pickupAddress && (
              <Row icon="home-outline" label="Your Pickup Address" value={enrollment.pickupAddress} />
            )}
          </View>
        </View>
      )}

      {/* Transport */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transport</Text>
        <View style={styles.card}>
          <Row
            icon="bus-outline"
            label="Pickup Service"
            value={enrollment.transportOpted ? 'Yes — Pickup & Drop' : 'No — Self Transport'}
          />
          {enrollment.pickupDistance ? (
            <>
              <View style={styles.divider} />
              <Row icon="map-outline" label="Distance to Academy" value={`${enrollment.pickupDistance} km`} />
            </>
          ) : null}
        </View>
      </View>

      {/* Payment */}
      {payment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.card}>
            <Row icon="cash-outline"   label="Training Fee"  value={formatCurrency(payment.amount)} />
            {payment.transportFee > 0 && (
              <>
                <View style={styles.divider} />
                <Row icon="bus-outline" label="Transport Fee" value={formatCurrency(payment.transportFee)} />
              </>
            )}
            <View style={styles.divider} />
            <Row icon="wallet-outline" label="Total Paid"    value={formatCurrency(payment.totalAmount)} />
            <View style={styles.divider} />
            <Row
              icon="checkmark-circle-outline"
              label="Payment Status"
              value={payment.status}
            />
          </View>
        </View>
      )}

      {/* Actions */}
      {enrollment.status === 'CONFIRMED' && enrollment.transportOpted && (
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate('TransitTracking', { enrollmentId: enrollment.id })}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.trackBtnText}>Track Live Transport</Text>
        </TouchableOpacity>
      )}

      {(['ACTIVE', 'COMPLETED', 'CONFIRMED'] as string[]).includes(enrollment.status) && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => setShowReview(true)}
        >
          <Ionicons name="star-outline" size={18} color={Colors.primary} />
          <Text style={styles.reviewBtnText}>Rate this Academy</Text>
        </TouchableOpacity>
      )}

      {payment && (
        <TouchableOpacity
          style={styles.receiptBtn}
          onPress={() => Share.share({
            message: [
              `SportNexus Payment Receipt`,
              `Academy: ${academy?.name ?? '—'}`,
              `Program: ${program?.name ?? '—'}`,
              `Booking Ref: #${bookingRef}`,
              `Training Fee: ${formatCurrency(payment.amount)}`,
              ...(payment.transportFee > 0 ? [`Transport Fee: ${formatCurrency(payment.transportFee)}`] : []),
              `Total Paid: ${formatCurrency(payment.totalAmount)}`,
              `Status: ${payment.status}`,
              `Date: ${enrolledDate}`,
            ].join('\n'),
          })}
        >
          <Ionicons name="receipt-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.receiptBtnText}>Share Receipt</Text>
        </TouchableOpacity>
      )}

      {(['PENDING', 'CONFIRMED'] as string[]).includes(enrollment.status) && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            Alert.alert(
              'Cancel Enrollment',
              'Are you sure you want to cancel this enrollment? This cannot be undone.',
              [
                { text: 'Keep Enrollment', style: 'cancel' },
                {
                  text: 'Cancel Enrollment',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setCancelling(true)
                      await enrollmentAPI.cancel(enrollment.id)
                    } catch (err: any) {
                      const msg: string = err?.response?.data?.error?.message ?? ''
                      // If it's already cancelled on the server, treat as success
                      if (!msg.toLowerCase().includes('cancel') && err?.response?.status !== 404) {
                        Alert.alert('Error', 'Could not cancel enrollment. Please try again.')
                        setCancelling(false)
                        return
                      }
                    }
                    updateEnrollment(enrollment.id, { status: 'CANCELLED' })
                    queryClient.invalidateQueries({ queryKey: ['my-enrollments'] })
                    setCancelling(false)
                    navigation.goBack()
                  },
                },
              ]
            )
          }}
          disabled={cancelling}
        >
          <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
          <Text style={styles.cancelBtnText}>{cancelling ? 'Cancelling...' : 'Cancel Enrollment'}</Text>
        </TouchableOpacity>
      )}

      {showReview && (
        <WriteReviewSheet
          academyId={(enrollment as any).slot?.program?.academy?.id ?? ''}
          academyName={(enrollment as any).slot?.program?.academy?.name ?? 'Academy'}
          onClose={() => setShowReview(false)}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  header:          { paddingTop: 16, paddingBottom: 20, paddingHorizontal: 16 },
  headerRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  academyIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  academyName:     { fontSize: FontSize.base, fontWeight: '800', color: '#fff' },
  programName:     { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  statusBadge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full },
  statusText:      { fontSize: FontSize.xs, fontWeight: '800' },
  bookingCard:     { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.navy, margin: 16, borderRadius: BorderRadius.lg, padding: 16, ...Shadow.sm },
  bookingLabel:    { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  bookingId:       { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', letterSpacing: 2, marginTop: 4 },
  bookingDate:     { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  section:         { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle:    { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  card:            { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, ...Shadow.sm },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  rowIcon:         { width: 32, height: 32, borderRadius: BorderRadius.sm, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  rowLabel:        { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  rowValue:        { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '600', marginTop: 1 },
  divider:         { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  trackBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, margin: 16, marginTop: 20, borderRadius: BorderRadius.md, paddingVertical: 16 },
  trackBtnText:    { color: '#fff', fontSize: FontSize.base, fontWeight: '800' },
  receiptBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, margin: 16, marginTop: 8, borderRadius: BorderRadius.md, paddingVertical: 13 },
  receiptBtnText:  { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  cancelBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.danger, backgroundColor: '#FEF2F2', margin: 16, marginTop: 8, borderRadius: BorderRadius.md, paddingVertical: 13 },
  cancelBtnText:   { color: Colors.danger, fontSize: FontSize.sm, fontWeight: '700' },
  reviewBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.tealXLight, margin: 16, marginTop: 8, borderRadius: BorderRadius.md, paddingVertical: 14 },
  reviewBtnText:   { color: Colors.primary, fontSize: FontSize.base, fontWeight: '700' },
})
