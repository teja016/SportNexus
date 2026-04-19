import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { Enrollment } from '@sportnexus/types'
import { formatCurrency, formatSlotTime } from '@sportnexus/utils'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'

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
  const enrollment: Enrollment = route.params?.enrollment
  if (!enrollment) return null

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.academyIconWrap}>
          <Text style={{ fontSize: 32 }}>🏟️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.academyName}>{academy?.name ?? 'Academy'}</Text>
          <Text style={styles.programName}>{program?.name ?? '—'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{enrollment.status}</Text>
        </View>
      </View>

      {/* Booking Reference */}
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

      {/* Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.card}>
          <Row icon="time-outline"     label="Slot Time"  value={slotTime} />
          <View style={styles.divider} />
          <Row icon="calendar-outline" label="Days"       value={days} />
          <View style={styles.divider} />
          <Row icon="hourglass-outline" label="Duration"  value={`${enrollment.durationMonths} month${enrollment.durationMonths > 1 ? 's' : ''}`} />
        </View>
      </View>

      {/* Program */}
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

      {/* Transport */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transport</Text>
        <View style={styles.card}>
          <Row
            icon="bus-outline"
            label="Pickup Service"
            value={enrollment.transportOpted ? 'Yes — Pickup & Drop' : 'No — Self Transport'}
          />
          {enrollment.transportOpted && enrollment.pickupAddress && (
            <>
              <View style={styles.divider} />
              <Row icon="location-outline" label="Pickup Address" value={enrollment.pickupAddress} />
            </>
          )}
          {enrollment.transportOpted && enrollment.pickupDistance && (
            <>
              <View style={styles.divider} />
              <Row icon="map-outline" label="Distance" value={`${enrollment.pickupDistance} km`} />
            </>
          )}
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  academyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  academyName:     { fontSize: FontSize.base, fontWeight: '800', color: Colors.textPrimary },
  programName:     { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', marginTop: 2 },
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
})
