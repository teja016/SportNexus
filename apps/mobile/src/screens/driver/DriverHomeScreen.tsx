import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { transitAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED:        '#F59E0B',
  DISPATCHED:       Colors.primary,
  ARRIVING:         '#0EA5E9',
  PICKED_UP:        Colors.accent,
  AT_ACADEMY:       '#8B5CF6',
  COMPLETED:        '#6B7280',
  CANCELLED_BY_USER:'#EF4444',
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED:        'Scheduled',
  DISPATCHED:       'En Route',
  ARRIVING:         'Arriving',
  PICKED_UP:        'Picked Up',
  AT_ACADEMY:       'At Academy',
  COMPLETED:        'Completed',
  CANCELLED_BY_USER:'Cancelled',
}

export default function DriverHomeScreen({ navigation }: any) {
  const { user, logout } = useAuthStore()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey:  ['driver-sessions-today'],
    queryFn:   () => transitAPI.getDriverToday(),
    staleTime: 30 * 1000,
  })

  const sessions: any[] = data ?? []
  const active  = sessions.filter((s) => !['COMPLETED', 'CANCELLED_BY_USER'].includes(s.status))
  const done    = sessions.filter((s) => ['COMPLETED', 'CANCELLED_BY_USER'].includes(s.status))

  function renderCard({ item }: { item: any }) {
    const student  = item.enrollment?.user
    const academy  = item.enrollment?.slot?.program?.academy
    const slot     = item.enrollment?.slot
    const isDone   = ['COMPLETED', 'CANCELLED_BY_USER'].includes(item.status)
    return (
      <TouchableOpacity
        style={[styles.card, isDone && styles.cardDone]}
        onPress={() => navigation.navigate('DriverActive', { session: item })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[item.status] ?? Colors.textMuted) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] ?? Colors.textMuted }]} />
            <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? Colors.textMuted }]}>{STATUS_LABEL[item.status] ?? item.status}</Text>
          </View>
          <Text style={styles.cardTime}>{slot?.timeStart ?? '—'}</Text>
        </View>

        <Text style={styles.cardStudent}>{student?.name ?? 'Student'}</Text>
        <View style={styles.cardRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.cardAddr} numberOfLines={1}>{item.enrollment?.pickupAddress ?? 'Pickup address not set'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="business-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.cardAcademy} numberOfLines={1}>{academy?.name ?? '—'}</Text>
        </View>

        {!isDone && (
          <View style={styles.startBtnRow}>
            <LinearGradient colors={[Colors.primary, '#0A6E65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtn}>
              <Ionicons name="navigate-outline" size={15} color="#fff" />
              <Text style={styles.startBtnText}>Open Session</Text>
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D9488', '#1E3A5F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View>
          <Text style={styles.headerGreet}>Good morning,</Text>
          <Text style={styles.headerName}>{user?.name?.split(' ')[0] ?? 'Driver'} 👋</Text>
          <Text style={styles.headerSub}>{sessions.length} session{sessions.length !== 1 ? 's' : ''} today · {active.length} pending</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading today's sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>🚌</Text>
          <Text style={styles.emptyTitle}>No sessions today</Text>
          <Text style={styles.emptyText}>You have no transport sessions scheduled for today.</Text>
        </View>
      ) : (
        <FlatList
          data={[...active, ...done]}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderCard}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          ListHeaderComponent={active.length > 0 ? (
            <Text style={styles.sectionLabel}>ACTIVE ({active.length})</Text>
          ) : null}
          ListFooterComponent={done.length > 0 ? (
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>COMPLETED ({done.length})</Text>
          ) : null}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header:      { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerGreet: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)' },
  headerName:  { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: -0.5 },
  headerSub:   { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  logoutBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },

  loading:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: FontSize.base, color: Colors.textSecondary },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle:  { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText:   { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  sectionLabel:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },

  card:        { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, ...Shadow.sm, gap: 8 },
  cardDone:    { opacity: 0.65 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  cardTime:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  cardStudent: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardAddr:    { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  cardAcademy: { flex: 1, fontSize: FontSize.sm, color: Colors.textMuted },
  startBtnRow: { marginTop: 4 },
  startBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: BorderRadius.md },
  startBtnText:{ color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
})
