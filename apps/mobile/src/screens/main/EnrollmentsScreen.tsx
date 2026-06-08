import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native'
import { MotiView } from 'moti'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { enrollmentAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
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
  const photo   = academy?.photos?.[0]?.url

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EnrollmentDetail', { enrollment })}
      activeOpacity={0.88}
    >
      {/* Image banner */}
      <View style={styles.cardBanner}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.bannerImg} resizeMode="cover" />
        ) : (
          <View style={[styles.bannerImg, { backgroundColor: sportColor + '20', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 36 }}>{SPORT_ICONS?.[sport] ?? '🏅'}</Text>
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(15,23,42,0.55)']} locations={[0.3, 1]} style={styles.bannerGradient} />

        {/* Sport label bottom-left over image */}
        <View style={[styles.bannerSport, { backgroundColor: sportColor }]}>
          <Text style={styles.bannerSportEmoji}>{SPORT_ICONS?.[sport] ?? '🏅'}</Text>
          <Text style={styles.bannerSportText}>{sport}</Text>
        </View>

        {/* Status badge top-right */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon as any} size={11} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.academyName} numberOfLines={1}>{academy?.name ?? '—'}</Text>
          <Text style={styles.programName}>{program?.name ?? '—'}</Text>
        </View>

        {/* Stats chips row */}
        <View style={styles.detailsRow}>
          {slot && (
            <View style={styles.detailChip}>
              <Ionicons name="time-outline" size={12} color={Colors.primary} />
              <Text style={styles.detailChipText}>{slot.timeStart} – {slot.timeEnd}</Text>
            </View>
          )}
          {slot?.daysOfWeek?.length > 0 && (
            <View style={styles.detailChip}>
              <Ionicons name="calendar-outline" size={12} color={Colors.primary} />
              <Text style={styles.detailChipText}>
                {(slot.daysOfWeek as string[]).slice(0, 3).map((d: string) => d.slice(0, 3)).join(', ')}
              </Text>
            </View>
          )}
          {enrollment.durationMonths && (
            <View style={styles.detailChip}>
              <Ionicons name="hourglass-outline" size={12} color={Colors.primary} />
              <Text style={styles.detailChipText}>{enrollment.durationMonths} mo</Text>
            </View>
          )}
          {enrollment.startDate && (
            <View style={styles.detailChip}>
              <Ionicons name="play-circle-outline" size={12} color={Colors.primary} />
              <Text style={styles.detailChipText}>
                {new Date(enrollment.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {payment?.totalAmount ? (
              <View style={styles.feeChip}>
                <Ionicons name="pricetag-outline" size={11} color={Colors.primary} />
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
  const { isAuthenticated, user } = useAuthStore()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn:  () => enrollmentAPI.getMyEnrollments(),
    staleTime: 30 * 1000,
    enabled:  isAuthenticated,
    retry:    2,
  })

  useFocusEffect(React.useCallback(() => { refetch() }, [refetch]))

  const apiEnrollments: Enrollment[] = data ?? []
  const apiIds = new Set(apiEnrollments.map((e) => e.id))
  const merged: Enrollment[] = apiEnrollments.map((apiE) => {
    const local = localEnrollments.find((l) => l.id === apiE.id)
    if (local && (local as any).payment) {
      // Always trust API for status — only supplement with local payment/date data
      return { ...apiE, payment: (local as any).payment, startDate: local.startDate ?? (apiE as any).startDate, endDate: local.endDate ?? (apiE as any).endDate } as Enrollment
    }
    return apiE
  })
  // Local-only enrollments: only show ones that belong to current user + are not stale-cancelled
  const localOnly = localEnrollments.filter(
    (e) => !apiIds.has(e.id) &&
      (e.userId === user?.id || e.userId === 'dev') &&
      e.status !== 'CANCELLED' &&
      e.status !== 'EXPIRED'
  )
  const all: Enrollment[] = [...merged, ...localOnly]
  const active    = all.filter((e) => ['PENDING', 'CONFIRMED', 'ACTIVE'].includes(e.status))
  const completed = all.filter((e) => e.status === 'EXPIRED')
  const cancelled = all.filter((e) => e.status === 'CANCELLED')
  const list = activeTab === 0 ? all : activeTab === 1 ? active : activeTab === 2 ? completed : cancelled

  return (
    <View style={styles.container}>
      {/* ── Compact gradient header strip ─────────────────── */}
      <LinearGradient
        colors={['#1AAFC9', '#1C2E4A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>My Enrollments</Text>
            <Text style={styles.headerSub}>{all.length} total · {active.length} active</Text>
          </View>
          <View style={styles.headerStatChips}>
            <View style={styles.headerChip}>
              <Ionicons name="fitness-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.headerChipText}>{active.length} active</Text>
            </View>
            <View style={[styles.headerChip, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Ionicons name="close-circle-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={[styles.headerChipText, { color: 'rgba(255,255,255,0.6)' }]}>{cancelled.length} cancelled</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <View style={styles.tabsScroll}>
        {[
          { label: 'All',       count: all.length,       icon: 'layers-outline' as const },
          { label: 'Active',    count: active.length,    icon: 'fitness-outline' as const },
          { label: 'Completed', count: completed.length, icon: 'trophy-outline' as const },
          { label: 'Cancelled', count: cancelled.length, icon: 'close-circle-outline' as const, danger: true },
        ].map((t, i) => (
          <TouchableOpacity
            key={t.label}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Ionicons
              name={t.icon}
              size={15}
              color={activeTab === i ? (t.danger ? Colors.danger : Colors.primary) : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === i && (t.danger ? styles.tabTextDanger : styles.tabTextActive)]}>{t.label}</Text>
            {t.count > 0 && (
              <View style={[styles.tabBadge, activeTab === i && (t.danger ? styles.tabBadgeDanger : styles.tabBadgeActive)]}>
                <Text style={[styles.tabBadgeText, activeTab === i && (t.danger ? styles.tabBadgeTextDanger : styles.tabBadgeTextActive)]}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading enrollments…</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 24, scale: 0.97 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'spring', delay: index * 60, damping: 18, stiffness: 150 }}
            >
              <EnrollmentCard enrollment={item} navigation={navigation} />
            </MotiView>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>
                {activeTab === 0 ? '📋' : activeTab === 1 ? '🏋️' : activeTab === 2 ? '🏆' : '❌'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 0 ? 'No enrollments yet'
                  : activeTab === 1 ? 'No active enrollments'
                  : activeTab === 2 ? 'No completed enrollments'
                  : 'No cancelled enrollments'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 0
                  ? 'Discover academies and book your first session'
                  : activeTab === 1
                  ? 'Your pending and confirmed sessions appear here'
                  : activeTab === 2
                  ? 'Expired sessions will appear here'
                  : 'Cancelled sessions appear here'}
              </Text>
              {activeTab <= 1 && (
                <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Home')}>
                  <LinearGradient
                    colors={['#1AAFC9', '#1592AA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.browseBtnGradient}
                  >
                    <Ionicons name="search-outline" size={16} color="#fff" />
                    <Text style={styles.browseBtnText}>Browse Academies</Text>
                  </LinearGradient>
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

  /* ── Header ── */
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.5 },
  headerSub:   { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  headerStatChips: { flexDirection: 'row', gap: 6 },
  headerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  headerChipText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.85)', fontWeight: FontWeight.semibold },

  /* ── Tabs ── */
  tabsScroll: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 13, paddingHorizontal: 8,
    marginRight: 4,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive:          { borderBottomColor: Colors.primary },
  tabText:            { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  tabTextActive:      { color: Colors.primary, fontWeight: FontWeight.bold },
  tabTextDanger:      { color: Colors.danger, fontWeight: FontWeight.bold },
  tabBadge:           { backgroundColor: Colors.borderLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  tabBadgeActive:     { backgroundColor: Colors.tealLight },
  tabBadgeDanger:     { backgroundColor: '#FEE2E2' },
  tabBadgeText:       { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold },
  tabBadgeTextActive: { color: Colors.primary },
  tabBadgeTextDanger: { color: Colors.danger },

  /* ── List ── */
  listContent: { padding: 16, gap: 12, paddingBottom: 32 },

  /* ── Loading ── */
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },

  /* ── Enrollment Card ── */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.md,
  },

  /* banner */
  cardBanner:      { height: 90, position: 'relative' },
  bannerImg:       { width: '100%', height: 90 },
  bannerGradient:  { position: 'absolute', top: 0, left: 0, right: 0, height: 90 },
  bannerSport: {
    position: 'absolute', bottom: 8, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  bannerSportEmoji: { fontSize: 10 },
  bannerSportText:  { fontSize: 9, color: '#fff', fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.4 },

  statusBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  cardContent: { padding: 14, gap: 10 },
  cardHeader:  { gap: 2 },
  academyName: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  programName: { fontSize: FontSize.sm, color: Colors.textSecondary },

  detailsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  detailChip:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.tealXLight,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  detailChipText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },

  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  feeChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  enrollId:    { fontSize: FontSize.xs, color: Colors.textMuted },

  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  trackBtnText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },

  /* ── Empty State ── */
  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyEmoji:    { fontSize: 56, marginBottom: 4 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  browseBtn:     { marginTop: 8, borderRadius: BorderRadius.full, overflow: 'hidden' },
  browseBtnGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  browseBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
})
