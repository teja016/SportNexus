import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { transitAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED:         '#F59E0B',
  DISPATCHED:        Colors.primary,
  ARRIVING:          '#0EA5E9',
  AT_ACADEMY:        '#8B5CF6',
  COMPLETED:         '#6B7280',
  CANCELLED_BY_USER: '#EF4444',
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED:         'Scheduled',
  DISPATCHED:        'En Route',
  ARRIVING:          'Arriving',
  AT_ACADEMY:        'At Academy',
  COMPLETED:         'Completed',
  CANCELLED_BY_USER: 'Cancelled',
}

const DONE_STATUSES = ['COMPLETED', 'CANCELLED_BY_USER']

export default function DriverHomeScreen({ navigation }: any) {
  const { user, logout } = useAuthStore()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-sessions-today'],
    queryFn:  () => transitAPI.getDriverToday(),
    staleTime: 30 * 1000,
  })

  const sessions: any[] = data ?? []
  const active = sessions.filter((s) => !DONE_STATUSES.includes(s.status))
  const done   = sessions.filter((s) => DONE_STATUSES.includes(s.status))

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  function renderCard({ item }: { item: any }) {
    const academy    = item.slot?.program?.academy
    const slotTime   = item.slot?.timeStart ?? '—'
    const passengerCount = item.passengers?.length ?? 0
    const isDone     = DONE_STATUSES.includes(item.status)
    const statusColor = STATUS_COLOR[item.status] ?? Colors.textMuted
    const statusLabel = STATUS_LABEL[item.status] ?? item.status

    return (
      <TouchableOpacity
        style={[styles.card, isDone && styles.cardDone]}
        onPress={() => navigation.navigate('DriverActive', { session: item })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <View style={styles.timeChip}>
            <Ionicons name="time-outline" size={13} color={Colors.primary} />
            <Text style={styles.timeText}>{slotTime}</Text>
          </View>
        </View>

        <View style={styles.academyRow}>
          <View style={styles.academyIconWrap}>
            <Ionicons name="business" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.academyName} numberOfLines={1}>{academy?.name ?? '—'}</Text>
            <Text style={styles.academyAddr} numberOfLines={1}>{academy?.address ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.passengerRow}>
          <View style={styles.passengerPill}>
            <Ionicons name="bus-outline" size={14} color={Colors.primary} />
            <Text style={styles.passengerCount}>
              {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {item.vehicleNumber ? (
            <View style={styles.vehiclePill}>
              <Ionicons name="car-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.vehicleText}>{item.vehicleNumber}</Text>
            </View>
          ) : null}
        </View>

        {!isDone && (
          <View style={styles.openBtnWrap}>
            <LinearGradient
              colors={[Colors.primary, '#0A6E65']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.openBtn}
            >
              <Ionicons name="navigate-outline" size={15} color="#fff" />
              <Text style={styles.openBtnText}>Open Session</Text>
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D9488', '#1E3A5F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerGreet}>{greeting},</Text>
          <Text style={styles.headerName}>{user?.name?.split(' ')[0] ?? 'Driver'}</Text>
          <Text style={styles.headerSub}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} today
            {active.length > 0 ? ` · ${active.length} pending` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading today's sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🚌</Text>
          <Text style={styles.emptyTitle}>No sessions today</Text>
          <Text style={styles.emptyText}>You have no transport sessions scheduled for today.</Text>
        </View>
      ) : (
        <FlatList
          data={[...active, ...done]}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderCard}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            active.length > 0 ? (
              <Text style={styles.sectionLabel}>ACTIVE ({active.length})</Text>
            ) : null
          }
          ListFooterComponent={
            done.length > 0 ? (
              <Text style={[styles.sectionLabel, styles.sectionLabelDone]}>
                COMPLETED ({done.length})
              </Text>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF' },
  header:         { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerGreet:    { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)' },
  headerName:     { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.5, marginTop: 2 },
  headerSub:      { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  logoutBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  loading:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:    { fontSize: FontSize.base, color: Colors.textSecondary },

  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyEmoji:     { fontSize: 56 },
  emptyTitle:     { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText:      { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  listContent:    { padding: 16, gap: 12, paddingBottom: 32 },
  sectionLabel:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  sectionLabelDone: { marginTop: 8 },

  card:           { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg, padding: 16, ...Shadow.sm, gap: 12 },
  cardDone:       { opacity: 0.6 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  statusText:     { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  timeChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.tealXLight, paddingHorizontal: 9, paddingVertical: 4, borderRadius: BorderRadius.full },
  timeText:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },

  academyRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  academyIconWrap:{ width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.tealXLight, alignItems: 'center', justifyContent: 'center' },
  academyName:    { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  academyAddr:    { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  passengerRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passengerPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.tealXLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full },
  passengerCount: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  vehiclePill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.borderLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full },
  vehicleText:    { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },

  openBtnWrap:    { marginTop: 2 },
  openBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: BorderRadius.md },
  openBtnText:    { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
})
