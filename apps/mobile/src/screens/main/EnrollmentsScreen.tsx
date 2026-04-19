import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { enrollmentAPI } from '../../services/api'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { formatCurrency, SPORT_ICONS } from '@sportnexus/utils'
import { Enrollment } from '@sportnexus/types'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow, SportColors } from '../../constants/theme'

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  PENDING:   { color: '#D97706', bg: '#FEF3C7', icon: 'time-outline',         label: 'Pending' },
  CONFIRMED: { color: Colors.primary, bg: Colors.tealXLight, icon: 'checkmark-circle-outline', label: 'Confirmed' },
  ACTIVE:    { color: '#059669', bg: '#D1FAE5', icon: 'fitness-outline',       label: 'Active' },
  CANCELLED: { color: Colors.danger, bg: '#FEE2E2', icon: 'close-circle-outline', label: 'Cancelled' },
  COMPLETED: { color: '#6366F1', bg: '#EDE9FE', icon: 'trophy-outline',        label: 'Completed' },
  EXPIRED:   { color: Colors.textMuted, bg: Colors.borderLight, icon: 'alert-circle-outline', label: 'Expired' },
}

function EnrollmentCard({ enrollment, navigation }: { enrollment: Enrollment; navigation: any }) {
  const academy = (enrollment as any).slot?.program?.academy
  const program = (enrollment as any).slot?.program
  const slot    = (enrollment as any).slot
  const payment = (enrollment as any).payment
  const sport   = program?.sportType ?? ''
  const sportColor = SportColors[sport] ?? Colors.primary
  const status  = STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.PENDING

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EnrollmentDetail', { enrollment })}
      activeOpacity={0.88}
    >
      {/* Left color accent */}
      <View style={[styles.cardAccent, { backgroundColor: sportColor }]} />

      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.academyName} numberOfLines={1}>{academy?.name ?? '—'}</Text>
            <View style={styles.programRow}>
              {!!sport && <Text style={styles.sportEmoji}>{SPORT_ICONS?.[sport] ?? ''}</Text>}
              <Text style={styles.programName}>{program?.name ?? '—'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon as any} size={11} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Details row */}
        <View style={styles.detailsRow}>
          {slot && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.detailText}>{slot.timeStart} – {slot.timeEnd}</Text>
            </View>
          )}
          {slot?.daysOfWeek?.length > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.detailText}>
                {(slot.daysOfWeek as string[]).slice(0, 3).map((d: string) => d.slice(0, 3)).join(', ')}
              </Text>
            </View>
          )}
          {enrollment.durationMonths && (
            <View style={styles.detailItem}>
              <Ionicons name="hourglass-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.detailText}>{enrollment.durationMonths}mo</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {payment?.totalAmount ? (
              <View style={styles.feeChip}>
                <Text style={styles.feeChipText}>{formatCurrency(payment.totalAmount)}</Text>
              </View>
            ) : null}
            <Text style={styles.enrollId}>#{(enrollment.id ?? '').slice(-6).toUpperCase()}</Text>
          </View>

          {enrollment.status === 'CONFIRMED' && enrollment.transportOpted && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate('TransitTracking', { enrollmentId: enrollment.id })}
            >
              <Ionicons name="navigate" size={13} color="#fff" />
              <Text style={styles.trackBtnText}>Track Live</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function EnrollmentsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState(0)
  const { enrollments: localEnrollments } = useLocalEnrollmentsStore()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn:  () => enrollmentAPI.getMyEnrollments(),
    staleTime: 30 * 1000,
  })

  useFocusEffect(React.useCallback(() => { refetch() }, [refetch]))

  const apiEnrollments: Enrollment[] = data ?? []
  const apiIds = new Set(apiEnrollments.map((e) => e.id))
  const all: Enrollment[] = [
    ...apiEnrollments,
    ...localEnrollments.filter((e) => !apiIds.has(e.id)),
  ]
  const active = all.filter((e) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(e.status))
  const past   = all.filter((e) => ['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(e.status))
  const list   = activeTab === 0 ? active : past

  return (
    <View style={styles.container}>
      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Enrollments</Text>
        <Text style={styles.headerSub}>{all.length} total · {active.length} active</Text>
      </View>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <View style={styles.tabs}>
        {[
          { label: 'Active', count: active.length },
          { label: 'Past',   count: past.length },
        ].map((t, i) => (
          <TouchableOpacity
            key={t.label}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t.label}</Text>
            {t.count > 0 && (
              <View style={[styles.tabCount, activeTab === i && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, activeTab === i && styles.tabCountTextActive]}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <EnrollmentCard enrollment={item} navigation={navigation} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name={activeTab === 0 ? 'fitness-outline' : 'time-outline'} size={40} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 0 ? 'No active enrollments' : 'No past enrollments'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 0 ? 'Discover academies and book your first session' : 'Your completed and cancelled sessions appear here'}
              </Text>
              {activeTab === 0 && (
                <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Home')}>
                  <Ionicons name="search-outline" size={16} color="#fff" />
                  <Text style={styles.browseBtnText}>Browse Academies</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header:      { backgroundColor: Colors.surface, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  headerSub:   { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: 16 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 13, paddingHorizontal: 4, marginRight: 24, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: Colors.primary },
  tabText:        { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  tabTextActive:  { color: Colors.primary, fontWeight: FontWeight.bold },
  tabCount:       { backgroundColor: Colors.borderLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full },
  tabCountActive: { backgroundColor: Colors.tealLight },
  tabCountText:   { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold },
  tabCountTextActive: { color: Colors.primary },

  card:        { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  cardAccent:  { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 10 },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  academyName: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  programRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sportEmoji:  { fontSize: 12 },
  programName: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  detailsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText:  { fontSize: FontSize.xs, color: Colors.textSecondary },

  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feeChip:     { backgroundColor: Colors.borderLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  feeChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  enrollId:    { fontSize: FontSize.xs, color: Colors.textMuted },
  trackBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.full, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  trackBtnText:{ fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },

  empty:         { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  browseBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.full, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  browseBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
})
