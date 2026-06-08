import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Linking, ScrollView, Dimensions, Alert, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'
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

function deriveState(session: any, passenger: any, timeStart?: string): TrackState {
  if (!session) {
    const startDate = passenger?.enrollment?.startDate
      ? new Date(passenger.enrollment.startDate)
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
  const queryClient = useQueryClient()
  const [showDriver, setShowDriver] = useState(false)
  const [countdown, setCountdown] = useState('')
  const [, forceUpdate] = useState(0)
  const generateAttempted = useRef(false)

  // Fetch today's passenger record (contains session + stop position)
  const { data: todayPassenger, isLoading: passengerLoading } = useQuery({
    queryKey: ['transit-today'],
    queryFn:  () => transitAPI.getToday(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  // Auto-generate session if none exists (handles enrollment after daily cron ran)
  const { mutate: generateSession, isPending: isGenerating } = useMutation({
    mutationFn: () => transitAPI.generateToday(),
    onSettled:  () => queryClient.invalidateQueries({ queryKey: ['transit-today'] }),
  })

  useEffect(() => {
    if (!passengerLoading && !todayPassenger && !generateAttempted.current) {
      generateAttempted.current = true
      generateSession()
    }
  }, [passengerLoading, todayPassenger])

  const resolvedSessionId: string | undefined =
    paramSessionId ?? todayPassenger?.session?.id

  // Fetch full session detail (live data, frequent refresh)
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['transit-session', resolvedSessionId],
    queryFn:  () => transitAPI.getById(resolvedSessionId!),
    enabled:  !!resolvedSessionId,
    staleTime: 20_000,
    refetchInterval: 30_000,
  })

  const sessionId = resolvedSessionId
  const { location, eta, status: socketStatus, isConnected } = useTransitSocket(sessionId ?? '')

  const slot      = session?.slot
  const timeStart = slot?.timeStart
  const academy   = slot?.program?.academy

  // Find this user's stop info from session passengers
  const myPassenger = session?.passengers?.find(
    (p: any) => p.id === todayPassenger?.id || p.enrollmentId === todayPassenger?.enrollmentId
  ) ?? todayPassenger
  const myStopOrder   = myPassenger?.stopOrder ?? 1
  const totalStops    = session?.passengers?.length ?? 1

  const mergedStatus = socketStatus !== 'SCHEDULED'
    ? socketStatus
    : (session?.status ?? 'SCHEDULED')

  const trackState = deriveState(session, todayPassenger, timeStart)

  // Countdown ticker — runs every 30s normally, every 5s in last 3 minutes, forces re-render when it hits 0
  useEffect(() => {
    if (!timeStart) return
    const tick = () => {
      const msLeft = msUntilTime(timeStart) - 45 * 60000
      setCountdown(formatCountdown(msLeft))
      if (msLeft <= 0) forceUpdate((n) => n + 1)
    }
    tick()
    const msLeft = msUntilTime(timeStart) - 45 * 60000
    const interval = msLeft > 3 * 60000 ? 30_000 : 5_000
    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [timeStart])

  const pickupLat = todayPassenger?.enrollment?.pickupLat ?? userLat ?? 17.4337
  const pickupLng = todayPassenger?.enrollment?.pickupLng ?? userLng ?? 78.4076
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
    const startDate = todayPassenger?.enrollment?.startDate
      ? new Date(todayPassenger.enrollment.startDate).toLocaleDateString('en-IN', {
          weekday: 'short', day: 'numeric', month: 'long',
        })
      : 'your start date'
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
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

  // ── State: initial loading or auto-generating ────────────────────────────
  if (passengerLoading || isGenerating || (sessionLoading && !session)) {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {isGenerating ? 'Setting up your transport...' : 'Loading transport info...'}
        </Text>
      </View>
    )
  }

  // ── State: no session today ───────────────────────────────────────────────
  if (trackState === 'no-session') {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.stateIcon}>
          <Text style={{ fontSize: 48 }}>🚌</Text>
        </View>
        <Text style={styles.stateTitle}>No Transport Today</Text>
        <Text style={styles.stateSub}>
          There's no transport session scheduled for today. Sessions are generated automatically each morning.
        </Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackBtnText}>Back to Enrollments</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── State: cancelled ─────────────────────────────────────────────────────
  if (trackState === 'cancelled') {
    return (
      <View style={styles.stateContainer}>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
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
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
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
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
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
                <TouchableOpacity style={styles.driverActionBtn} onPress={callDriver}>
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

  const statusLabel =
    mergedStatus === 'AT_ACADEMY' ? 'At Academy'  :
    mergedStatus === 'PICKED_UP'  ? 'In-Transit'  :
    mergedStatus === 'ARRIVING'   ? 'Arriving'    :
    mergedStatus === 'DISPATCHED' ? 'Driver Sent' :
    mergedStatus === 'SCHEDULED'  ? 'Scheduled'   :
    STATUS_STEPS[currentStep]?.label ?? 'Tracking'

  const progressPct = Math.min(((currentStep + 1) / STATUS_STEPS.length) * 100, 100)

  return (
    <View style={styles.container}>

      {/* ── Gradient top header bar ───────────────── */}
      <LinearGradient
        colors={['#1AAFC9', '#1C2E4A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topBar}
      >
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.topBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.topBarTitle}>Transit Tracking</Text>
            <Text style={styles.topBarSub}>{academy?.name ?? 'Live tracking'}</Text>
          </View>
        </View>
        <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
      </LinearGradient>

      {/* ── Map area ──────────────────────────────── */}
      <View style={styles.mapContainer}>
        <TrackingMap
          driverLat={location?.lat ?? destLat}
          driverLng={location?.lng ?? destLng}
          pickupLat={pickupLat}
          pickupLng={pickupLng}
          destLat={destLat}
          destLng={destLng}
          status={mergedStatus}
          onDriverPress={() => setShowDriver(true)}
        />

        {/* Reconnecting banner */}
        {!isConnected && trackState === 'live' && (
          <View style={styles.reconnectBanner}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.reconnectText}>Reconnecting...</Text>
          </View>
        )}

        {/* User/child photo overlay — top right with LIVE badge */}
        <View style={styles.livePhotoWrap}>
          {isLive && isConnected && (
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <View style={styles.liveAvatarBox}>
            <Text style={{ fontSize: 28 }}>👦</Text>
          </View>
        </View>

      </View>

      {/* ── Bottom sheet ──────────────────────────── */}
      <MotiView
        from={{ translateY: 200, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 160 }}
        style={styles.bottomSheet}
      >

        {/* Status row */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 150 }}>
        <View style={styles.statusRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentStatusLabel}>CURRENT STATUS</Text>
            <Text style={styles.statusBigText}>{statusLabel}</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaBadgeSmall}>ETA</Text>
            <Text style={styles.etaBadgeBig}>{eta != null ? `${eta} Mins` : '—'}</Text>
          </View>
        </View>
        </MotiView>

        {/* Progress bar */}
        <MotiView from={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ type: 'timing', delay: 250, duration: 500 }}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
        </MotiView>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Driver card */}
        {driverDetails && (
          <MotiView from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'spring', delay: 320, damping: 18, stiffness: 150 }}>
          <TouchableOpacity style={styles.driverCard} onPress={() => setShowDriver(true)} activeOpacity={0.85}>
            <View style={styles.driverAvatar}>
              <Text style={{ fontSize: 22 }}>👨‍✈️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverDetails.name}</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.driverMetaText}>4.9 · Driver</Text>
              </View>
            </View>
            <View style={styles.driverBtns}>
              <TouchableOpacity style={styles.driverActionBtn}>
                <Ionicons name="chatbubble-outline" size={17} color={Colors.textSecondary} />
              </TouchableOpacity>
              {!!driverDetails.phone && (
                <TouchableOpacity style={styles.driverActionBtn} onPress={callDriver}>
                  <Ionicons name="call" size={17} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
          </MotiView>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Emergency + Share */}
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 420, damping: 18, stiffness: 150 }}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.emergencyBtn]}
            onPress={() => Alert.alert('Emergency', 'Calling emergency services...')}
          >
            <View style={styles.emergencyIconCircle}>
              <Text style={styles.emergencyAsterisk}>✳</Text>
            </View>
            <Text style={styles.emergencyText}>Emergency Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn]}
            onPress={() => {
              const msg = `Tracking ${session?.driverName ?? 'driver'} — ETA ${eta ?? '?'} min`
              Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`)
            }}
          >
            <Ionicons name="share-social-outline" size={22} color={Colors.textSecondary} />
            <Text style={styles.shareText}>Share Link</Text>
          </TouchableOpacity>
        </View>
        </MotiView>

        {/* Cancel */}
        {CANCELLABLE.includes(mergedStatus) && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending
              ? <ActivityIndicator size="small" color={Colors.danger} />
              : <Text style={styles.cancelBtnText}>Cancel Today's Transport</Text>
            }
          </TouchableOpacity>
        )}
      </MotiView>

      {showDriver && driverDetails && (
        <DriverDetailModal driver={driverDetails} onClose={() => setShowDriver(false)} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.background },

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

  // ── Top header bar ───────────────────────────────────────────────────────
  topBar:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, zIndex: 10 },
  topBarLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBackBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  topBarTitle:       { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: '#fff' },
  topBarSub:         { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  // ── Map ──────────────────────────────────────────────────────────────────
  mapContainer:      { flex: 1, position: 'relative' },
  reconnectBanner:   { position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  reconnectText:     { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },

  // User photo + LIVE badge (top-right of map)
  livePhotoWrap:     { position: 'absolute', top: 16, right: 16, zIndex: 20, alignItems: 'flex-end', gap: 6 },
  liveBadge:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-end' },
  liveDot:           { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText:          { color: '#fff', fontWeight: '800', fontSize: FontSize.xs, letterSpacing: 1 },
  liveAvatarBox:     { width: 72, height: 72, borderRadius: 12, backgroundColor: '#1C2E4A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', overflow: 'hidden' },

  // ── Bottom sheet ─────────────────────────────────────────────────────────
  bottomSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 28, ...Shadow.lg },

  // Status row
  statusRow:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  currentStatusLabel:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statusBigText:     { fontSize: 30, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: -0.5 },
  etaBadge:          { backgroundColor: '#F1F5F9', borderRadius: BorderRadius.lg, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', minWidth: 80 },
  etaBadgeSmall:     { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  etaBadgeBig:       { fontSize: FontSize.lg, color: Colors.textPrimary, fontWeight: FontWeight.extrabold, marginTop: 2 },

  // Progress bar
  progressTrack:     { height: 6, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressFill:      { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },

  divider:           { height: 1, backgroundColor: Colors.borderLight, marginBottom: 14 },

  // Driver card
  driverCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  driverAvatar:      { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C2E4A', alignItems: 'center', justifyContent: 'center' },
  driverName:        { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  vehicleNum:        { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  driverMeta:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  driverMetaText:    { fontSize: FontSize.sm, color: Colors.textSecondary },
  driverBtns:        { flexDirection: 'row', gap: 10 },
  driverActionBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  // Emergency + Share action buttons
  actionRow:         { flexDirection: 'row', gap: 12 },
  actionBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: BorderRadius.xl },
  emergencyBtn:      { backgroundColor: '#FEF2F2' },
  emergencyIconCircle:{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  emergencyAsterisk: { fontSize: 16, color: Colors.danger, fontWeight: '800' },
  emergencyText:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.danger },
  shareBtn:          { backgroundColor: '#F1F5F9' },
  shareText:         { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },

  cancelBtn:         { marginTop: 12, paddingVertical: 12, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.danger, alignItems: 'center' },
  cancelBtnText:     { fontSize: FontSize.sm, fontWeight: '700', color: Colors.danger },
})
