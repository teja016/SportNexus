import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Linking, ScrollView, Dimensions, Alert, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'
import TrackingMap from '../../components/TrackingMap'
import DriverDetailModal, { DriverDetails } from '../../components/DriverDetailModal'
import { useTransitSocket } from '../../hooks/useTransitSocket'
import { transitAPI } from '../../services/api'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const STATUS_STEPS = [
  { key: 'SCHEDULED',  label: 'Scheduled',     icon: 'time-outline' },
  { key: 'DISPATCHED', label: 'Driver Sent',    icon: 'car-outline' },
  { key: 'ARRIVING',   label: 'Arriving',       icon: 'navigate-outline' },
  { key: 'PICKED_UP',  label: 'Picked Up',      icon: 'person-outline' },
  { key: 'AT_ACADEMY', label: 'At Academy',     icon: 'school-outline' },
  { key: 'COMPLETED',  label: 'Completed',      icon: 'checkmark-circle-outline' },
]

const CANCELLABLE = ['SCHEDULED', 'DISPATCHED', 'ARRIVING']

// ── Helper: ms until HH:MM today ─────────────────────────────────────────────
function msUntilTime(timeStart: string): number {
  const [h, m] = timeStart.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  return target.getTime() - Date.now()
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  if (totalMin === 0) return 'less than 1 min'
  return `${m}m`
}

// ── Derive screen state from data ─────────────────────────────────────────────
type TrackState =
  | 'future'        // startDate > today
  | 'no-session'    // today, but no session yet
  | 'too-early'     // session exists, > 45 min before slot
  | 'pre-pickup'    // session SCHEDULED, within 45 min window
  | 'live'          // DISPATCHED / ARRIVING / PICKED_UP / AT_ACADEMY
  | 'completed'
  | 'cancelled'

function deriveState(session: any, enrollmentFromStore: any, timeStart?: string): TrackState {
  if (!session) {
    // Check if startDate is in the future
    const startDate = enrollmentFromStore?.startDate
      ? new Date(enrollmentFromStore.startDate)
      : null
    if (startDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      if (startDate > today) return 'future'
    }
    return 'no-session'
  }

  const s = session.status
  if (s === 'CANCELLED_BY_USER') return 'cancelled'
  if (s === 'COMPLETED')         return 'completed'
  if (['DISPATCHED', 'ARRIVING', 'PICKED_UP', 'AT_ACADEMY'].includes(s)) return 'live'

  // SCHEDULED — check time
  if (timeStart) {
    const msUntil = msUntilTime(timeStart)
    if (msUntil > 45 * 60000) return 'too-early'
  }
  return 'pre-pickup'
}

export default function TransitTrackingScreen({ route, navigation }: any) {
  const { sessionId: paramSessionId, enrollmentId } = route.params ?? {}
  const { userLat, userLng } = useAuthStore()
  const { enrollments } = useLocalEnrollmentsStore()
  const queryClient = useQueryClient()
  const [showDriver, setShowDriver] = useState(false)
  const [countdown, setCountdown] = useState('')
  const [, forceUpdate] = useState(0)

  const enrollmentFromStore = enrollments.find(
    (e) => e.id === (enrollmentId ?? paramSessionId)
  )

  // Resolve sessionId: param → today's list → undefined
  const { data: todaySessions } = useQuery({
    queryKey: ['transit-today'],
    queryFn:  () => transitAPI.getToday(),
    enabled:  !paramSessionId,
    staleTime: 30_000,
  })
  const resolvedSessionId: string | undefined =
    paramSessionId ??
    todaySessions?.find((s: any) => s.enrollmentId === enrollmentId)?.id

  // Fetch session detail
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['transit-session', resolvedSessionId],
    queryFn:  () => transitAPI.getById(resolvedSessionId!),
    enabled:  !!resolvedSessionId,
    staleTime: 20_000,
    refetchInterval: 30_000,
  })

  // Auto-init session if no session and startDate is today
  const initMutation = useMutation({
    mutationFn: () => transitAPI.initSession(enrollmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transit-today'] })
    },
  })

  const sessionId = resolvedSessionId
  const { location, eta, status: socketStatus, isConnected } = useTransitSocket(sessionId ?? '')

  const slot      = session?.enrollment?.slot
  const timeStart = slot?.timeStart
  const academy   = slot?.program?.academy

  const mergedStatus = socketStatus !== 'SCHEDULED'
    ? socketStatus
    : (session?.status ?? 'SCHEDULED')

  const trackState = deriveState(session, enrollmentFromStore, timeStart)

  // Countdown ticker — runs every 30s normally, every 5s in last 3 minutes, forces re-render when it hits 0
  useEffect(() => {
    if (!timeStart) return
    const tick = () => {
      const msLeft = msUntilTime(timeStart) - 45 * 60000
      setCountdown(formatCountdown(msLeft))
      if (msLeft <= 0) forceUpdate((n) => n + 1)   // trigger state re-derive when window opens
    }
    tick()
    const msLeft = msUntilTime(timeStart) - 45 * 60000
    const interval = msLeft > 3 * 60000 ? 30_000 : 5_000
    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [timeStart])

  // Auto-init today's session when no session found
  useEffect(() => {
    if (trackState === 'no-session' && enrollmentId && !initMutation.isPending && !initMutation.isSuccess) {
      initMutation.mutate()
    }
  }, [trackState])

  const pickupLat = userLat ?? 17.4337
  const pickupLng = userLng ?? 78.4076
  const destLat   = academy?.lat ?? 17.4156
  const destLng   = academy?.lng ?? 78.4347

  const driverDetails: DriverDetails | null = session ? {
    name:          session.driverName    ?? 'Driver will be assigned soon',
    phone:         session.driverPhone   ?? '',
    vehicleNumber: session.vehicleNumber ?? 'Pending assignment',
    vehicleModel:  'Pickup Vehicle',
    vehicleColor:  '',
    licenseNumber: '',
    aadharLast4:   '',
  } : null

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === mergedStatus)
  const isLive      = ['ARRIVING', 'PICKED_UP'].includes(mergedStatus)

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => transitAPI.cancelToday(sessionId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transit-session', sessionId] }),
    onError:   () => Alert.alert('Could not cancel', 'Transport may already be in progress.'),
  })

  function handleCancel() {
    Alert.alert(
      'Cancel Transport',
      "Cancel today's pickup? You'll need to arrange your own commute.",
      [
        { text: 'Keep Transport', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    )
  }

  function callDriver() {
    if (driverDetails?.phone) Linking.openURL(`tel:${driverDetails.phone}`)
  }

  // Pulsing LIVE dot
  const pulseAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  // ── State: future start date ──────────────────────────────────────────────
  if (trackState === 'future') {
    const startDate = enrollmentFromStore?.startDate
      ? new Date(enrollmentFromStore.startDate as any).toLocaleDateString('en-IN', {
          weekday: 'short', day: 'numeric', month: 'long',
        })
      : 'your start date'
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.stateIcon}>
          <Text style={{ fontSize: 48 }}>🚌</Text>
        </View>
        <Text style={styles.stateTitle}>Transport Not Started Yet</Text>
        <Text style={styles.stateSub}>
          Your first pickup is on {startDate}. You'll get a notification 30 minutes before the driver arrives.
        </Text>
        <View style={styles.stateInfoCard}>
          <Ionicons name="notifications-outline" size={16} color={Colors.primary} />
          <Text style={styles.stateInfoText}>
            Notifications are sent 1 hour before, 30 minutes before, and when the driver is assigned.
          </Text>
        </View>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackBtnText}>Back to Enrollments</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── State: loading / auto-init ────────────────────────────────────────────
  if (trackState === 'no-session' || (sessionLoading && !session)) {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Setting up your transport...</Text>
      </View>
    )
  }

  // ── State: cancelled ─────────────────────────────────────────────────────
  if (trackState === 'cancelled') {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.stateIcon, { backgroundColor: '#FEF2F2' }]}>
          <Ionicons name="close-circle" size={48} color={Colors.danger} />
        </View>
        <Text style={styles.stateTitle}>Transport Cancelled</Text>
        <Text style={styles.stateSub}>You cancelled today's pickup. Please arrange your own commute to the academy.</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackBtnText}>Back to Enrollments</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── State: completed ─────────────────────────────────────────────────────
  if (trackState === 'completed') {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.stateIcon, { backgroundColor: '#ECFDF5' }]}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.accent} />
        </View>
        <Text style={styles.stateTitle}>You've Arrived!</Text>
        <Text style={styles.stateSub}>Today's transport is complete. Have a great training session!</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackBtnText}>Back to Enrollments</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── State: too early (countdown) ─────────────────────────────────────────
  if (trackState === 'too-early') {
    const pickupAt = timeStart
      ? new Date(new Date().setHours(
          parseInt(timeStart.split(':')[0]),
          parseInt(timeStart.split(':')[1]), 0, 0
        )).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '—'

    return (
      <View style={[styles.stateContainer, { justifyContent: 'flex-start', paddingTop: 80 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.countdownCard}>
          <Text style={styles.countdownEmoji}>🕐</Text>
          <Text style={styles.countdownLabel}>Pickup scheduled at</Text>
          <Text style={styles.countdownTime}>{pickupAt}</Text>
          <Text style={styles.countdownSub}>Live tracking starts 45 minutes before pickup</Text>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownBadgeText}>Starts in {countdown || '...'}</Text>
          </View>
        </View>

        {/* Driver card if assigned */}
        {driverDetails && session?.driverName ? (
          <View style={styles.earlyDriverCard}>
            <Text style={styles.earlyDriverTitle}>Your Driver</Text>
            <View style={styles.earlyDriverRow}>
              <View style={styles.driverAvatar}><Text style={{ fontSize: 22 }}>👨‍✈️</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{driverDetails.name}</Text>
                <Text style={styles.vehicleNum}>{driverDetails.vehicleNumber}</Text>
              </View>
              {!!driverDetails.phone && (
                <TouchableOpacity style={styles.callBtn} onPress={callDriver}>
                  <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.pendingDriverCard}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <Text style={styles.pendingDriverText}>
              Driver will be assigned closer to your pickup time
            </Text>
          </View>
        )}

        {/* Cancel button */}
        <TouchableOpacity style={styles.cancelBtnEarly} onPress={handleCancel} disabled={cancelMutation.isPending}>
          {cancelMutation.isPending
            ? <ActivityIndicator size="small" color={Colors.danger} />
            : <Text style={styles.cancelBtnText}>Cancel Today's Transport</Text>
          }
        </TouchableOpacity>
      </View>
    )
  }

  // ── State: pre-pickup & live tracking ────────────────────────────────────
  // Guard: if session still loading after state transition, show spinner
  if (!session && sessionLoading) {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading tracking info...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      {!isConnected && trackState === 'live' && (
        <View style={styles.reconnectBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.reconnectText}>Reconnecting...</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        <TrackingMap
          driverLat={location?.lat ?? pickupLat + 0.012}
          driverLng={location?.lng ?? pickupLng - 0.008}
          pickupLat={pickupLat}
          pickupLng={pickupLng}
          destLat={destLat}
          destLng={destLng}
          status={mergedStatus}
          onDriverPress={() => setShowDriver(true)}
        />
      </View>

      {isLive && isConnected && (
        <View style={styles.liveOverlay}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      <View style={styles.bottomSheet}>
        {/* ETA */}
        <View style={styles.etaBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <Text style={styles.etaValue}>
              {mergedStatus === 'AT_ACADEMY'  ? 'Arrived at Academy' :
               mergedStatus === 'PICKED_UP'   ? 'En route to Academy' :
               mergedStatus === 'SCHEDULED'   ? 'Waiting for driver' :
               eta != null                    ? `${eta} min away`
                                             : 'Driver on the way'}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {STATUS_STEPS[currentStep]?.label ?? mergedStatus}
            </Text>
          </View>
        </View>

        {/* Driver card */}
        {driverDetails && (
          <TouchableOpacity style={styles.driverCard} onPress={() => setShowDriver(true)} activeOpacity={0.8}>
            <View style={styles.driverAvatar}><Text style={{ fontSize: 26 }}>👨‍✈️</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverDetails.name}</Text>
              <Text style={styles.vehicleNum}>{driverDetails.vehicleNumber}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!!driverDetails.phone && (
                <TouchableOpacity style={styles.callBtn} onPress={callDriver}>
                  <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.infoBtn} onPress={() => setShowDriver(true)}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Progress steps */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepsScroll}
          contentContainerStyle={styles.stepsRow}>
          {STATUS_STEPS.map((step, idx) => {
            const done    = idx < currentStep
            const current = idx === currentStep
            return (
              <View key={step.key} style={styles.stepItem}>
                <View style={[styles.stepDot, done && styles.stepDotDone, current && styles.stepDotCurrent]}>
                  {done
                    ? <Ionicons name="checkmark" size={12} color="#fff" />
                    : <Ionicons name={step.icon as any} size={12} color={current ? '#fff' : Colors.textMuted} />
                  }
                </View>
                {idx < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, done && styles.stepLineDone]} />
                )}
                <Text style={[styles.stepLabel, current && styles.stepLabelActive]} numberOfLines={1}>
                  {step.label}
                </Text>
              </View>
            )
          })}
        </ScrollView>

        {/* Route row */}
        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.routeText} numberOfLines={1}>Your Location</Text>
          </View>
          <View style={styles.routeDash} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.navy }]} />
            <Text style={styles.routeText} numberOfLines={1}>{academy?.name ?? 'Academy'}</Text>
          </View>
        </View>

        {/* Cancel */}
        {CANCELLABLE.includes(mergedStatus) && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending
              ? <ActivityIndicator size="small" color={Colors.danger} />
              : <Text style={styles.cancelBtnText}>Cancel Today's Transport</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {showDriver && driverDetails && (
        <DriverDetailModal driver={driverDetails} onClose={() => setShowDriver(false)} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.background },
  mapContainer:      { flex: 1 },

  // Shared state screens
  stateContainer:    { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  stateIcon:         { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  stateTitle:        { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  stateSub:          { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  stateInfoCard:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.tealXLight, borderRadius: BorderRadius.md, padding: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  stateInfoText:     { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  goBackBtn:         { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: BorderRadius.lg, marginTop: 4 },
  goBackBtnText:     { color: '#fff', fontWeight: '700', fontSize: FontSize.base },
  loadingText:       { marginTop: 12, fontSize: FontSize.base, color: Colors.textSecondary },

  // Countdown state
  countdownCard:     { width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 24, alignItems: 'center', gap: 8, ...Shadow.md },
  countdownEmoji:    { fontSize: 52, marginBottom: 4 },
  countdownLabel:    { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  countdownTime:     { fontSize: 36, fontWeight: '800', color: Colors.textPrimary },
  countdownSub:      { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  countdownBadge:    { backgroundColor: Colors.tealLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, marginTop: 4 },
  countdownBadgeText:{ fontSize: FontSize.base, fontWeight: '700', color: Colors.primary },
  earlyDriverCard:   { width: '100%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, gap: 10, ...Shadow.sm },
  earlyDriverTitle:  { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  earlyDriverRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingDriverCard: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: Colors.tealXLight, borderRadius: BorderRadius.md, padding: 14, width: '100%' },
  pendingDriverText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  cancelBtnEarly:    { width: '100%', paddingVertical: 12, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.danger, alignItems: 'center', marginTop: 4 },

  // Map overlay
  backBtn:           { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 999, ...Shadow.sm },
  reconnectBanner:   { position: 'absolute', top: 16, left: 72, right: 16, zIndex: 998, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  reconnectText:     { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },
  liveOverlay:       { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  liveDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveText:          { color: '#fff', fontWeight: '800', fontSize: FontSize.xs, letterSpacing: 1 },

  // Bottom sheet
  bottomSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 16, paddingBottom: 24, ...Shadow.sm, maxHeight: SCREEN_HEIGHT * 0.52 },
  etaBanner:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  etaLabel:          { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  etaValue:          { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  statusPill:        { backgroundColor: Colors.tealLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  statusPillText:    { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },

  driverCard:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  driverAvatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  driverName:        { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  vehicleNum:        { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  callBtn:           { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  infoBtn:           { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },

  stepsScroll:       { marginTop: 14 },
  stepsRow:          { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 4, gap: 0 },
  stepItem:          { alignItems: 'center', flexDirection: 'row' },
  stepDot:           { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotDone:       { backgroundColor: Colors.accent },
  stepDotCurrent:    { backgroundColor: Colors.primary },
  stepLine:          { width: 28, height: 2, backgroundColor: Colors.border },
  stepLineDone:      { backgroundColor: Colors.accent },
  stepLabel:         { position: 'absolute', top: 30, fontSize: 9, color: Colors.textMuted, width: 56, textAlign: 'center', left: -14 },
  stepLabelActive:   { color: Colors.primary, fontWeight: '700' },

  routeRow:          { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
  routePoint:        { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  routeDot:          { width: 10, height: 10, borderRadius: 5 },
  routeText:         { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  routeDash:         { width: 20, height: 1, backgroundColor: Colors.border },

  cancelBtn:         { marginTop: 14, paddingVertical: 12, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.danger, alignItems: 'center' },
  cancelBtnText:     { fontSize: FontSize.sm, fontWeight: '700', color: Colors.danger },
})
