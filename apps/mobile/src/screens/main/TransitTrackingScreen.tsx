import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Linking, ScrollView, Dimensions, Alert, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'
import TrackingMap from '../../components/TrackingMap'
import DriverDetailModal, { DriverDetails } from '../../components/DriverDetailModal'
import { useTransitSocket } from '../../hooks/useTransitSocket'
import { transitAPI } from '../../services/api'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const STATUS_STEPS = [
  { key: 'SCHEDULED',      label: 'Scheduled',      icon: 'time-outline' },
  { key: 'DISPATCHED',     label: 'Driver Assigned', icon: 'car-outline' },
  { key: 'ARRIVING',       label: 'On the Way',      icon: 'navigate-outline' },
  { key: 'PICKED_UP',      label: 'Picked Up',       icon: 'person-outline' },
  { key: 'AT_ACADEMY',     label: 'At Academy',      icon: 'school-outline' },
  { key: 'COMPLETED',      label: 'Completed',       icon: 'checkmark-circle-outline' },
]

const CANCELLABLE_STATUSES = ['SCHEDULED', 'DISPATCHED', 'ARRIVING']

export default function TransitTrackingScreen({ route, navigation }: any) {
  const { sessionId: paramSessionId, enrollmentId } = route.params ?? {}
  const { userLat, userLng } = useAuthStore()
  const queryClient = useQueryClient()
  const [showDriver, setShowDriver] = useState(false)

  // If navigated via enrollmentId, fetch today's sessions and find the matching one
  const { data: todaySessions } = useQuery({
    queryKey: ['transit-today'],
    queryFn:  () => transitAPI.getToday(),
    enabled:  !paramSessionId && !!enrollmentId,
    staleTime: 30_000,
  })
  const resolvedSessionId: string | undefined =
    paramSessionId ??
    todaySessions?.find((s: any) => s.enrollmentId === enrollmentId)?.id

  // Fetch session details (driver info, initial status)
  const { data: session, isLoading } = useQuery({
    queryKey: ['transit-session', resolvedSessionId],
    queryFn:  () => transitAPI.getById(resolvedSessionId!),
    enabled:  !!resolvedSessionId,
    staleTime: 30_000,
  })

  const sessionId = resolvedSessionId

  // Real-time socket: driver location + status
  const { location, eta, status: socketStatus, isConnected } = useTransitSocket(sessionId ?? '')

  // Merge: socket status overrides DB status once live
  const status = socketStatus !== 'SCHEDULED' ? socketStatus : (session?.status ?? 'SCHEDULED')

  const academy = session?.enrollment?.slot?.program?.academy
  const pickupLat = userLat ?? 17.4337
  const pickupLng = userLng ?? 78.4076
  const destLat   = academy?.lat ?? 17.4156
  const destLng   = academy?.lng ?? 78.4347

  const driverDetails: DriverDetails | null = session ? {
    name:          session.driverName   ?? 'Driver',
    phone:         session.driverPhone  ?? '',
    vehicleNumber: session.vehicleNumber ?? '',
    vehicleModel:  'Pickup Vehicle',
    vehicleColor:  '',
    licenseNumber: '',
    aadharLast4:   '',
  } : null

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === status)
  const isLive       = ['ARRIVING', 'PICKED_UP'].includes(status)
  const isCancelled  = status === 'CANCELLED_BY_USER'
  const isCompleted  = status === 'COMPLETED'
  const canCancel    = CANCELLABLE_STATUSES.includes(status)

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => transitAPI.cancelToday(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transit-session', sessionId] })
    },
    onError: () => {
      Alert.alert('Could not cancel', 'Transport may already be in progress.')
    },
  })

  function handleCancel() {
    Alert.alert(
      'Cancel Transport',
      "Are you sure you want to cancel today's pickup? You'll need to manage your own commute.",
      [
        { text: 'Keep Transport', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ]
    )
  }

  function callDriver() {
    if (driverDetails?.phone) {
      Linking.openURL(`tel:${driverDetails.phone}`)
    }
  }

  // Pulsing live dot
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading tracking...</Text>
      </View>
    )
  }

  if (isCancelled) {
    return (
      <View style={styles.cancelledContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.cancelledContent}>
          <View style={styles.cancelledIcon}>
            <Ionicons name="close-circle" size={56} color={Colors.danger} />
          </View>
          <Text style={styles.cancelledTitle}>Transport Cancelled</Text>
          <Text style={styles.cancelledSub}>
            You cancelled today's pickup. Please manage your own commute to the academy.
          </Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackBtnText}>Back to Enrollments</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Back button overlay */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Connection status */}
      {!isConnected && !isCompleted && (
        <View style={styles.reconnectBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.reconnectText}>Reconnecting...</Text>
        </View>
      )}

      {/* Full-screen Map */}
      <View style={styles.mapContainer}>
        <TrackingMap
          driverLat={location?.lat ?? pickupLat + 0.01}
          driverLng={location?.lng ?? pickupLng - 0.008}
          pickupLat={pickupLat}
          pickupLng={pickupLng}
          destLat={destLat}
          destLng={destLng}
          status={status}
          onDriverPress={() => setShowDriver(true)}
        />
      </View>

      {/* LIVE badge */}
      {isLive && isConnected && (
        <View style={styles.liveOverlay}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* ETA Banner */}
        <View style={styles.etaBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <Text style={styles.etaValue}>
              {isCompleted       ? 'Session Complete!' :
               status === 'AT_ACADEMY' ? 'Arrived at Academy' :
               status === 'PICKED_UP'  ? 'En route to Academy' :
               eta != null             ? `${eta} min away`
                                       : 'Calculating...'}
            </Text>
          </View>
          <View style={[styles.statusPill, isCompleted && styles.statusPillDone]}>
            <Text style={styles.statusPillText}>
              {STATUS_STEPS[currentStep]?.label ?? status}
            </Text>
          </View>
        </View>

        {/* Driver Card */}
        {driverDetails && driverDetails.name !== 'Driver' && (
          <TouchableOpacity style={styles.driverCard} onPress={() => setShowDriver(true)} activeOpacity={0.8}>
            <View style={styles.driverAvatar}>
              <Text style={{ fontSize: 26 }}>👨‍✈️</Text>
            </View>
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

        {/* Progress Steps */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.stepsScroll}
          contentContainerStyle={styles.stepsRow}
        >
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

        {/* Route info */}
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

        {/* Cancel button */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
          >
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

  loadingContainer:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.background },
  loadingText:       { fontSize: FontSize.base, color: Colors.textSecondary },

  cancelledContainer:{ flex: 1, backgroundColor: Colors.background },
  cancelledContent:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  cancelledIcon:     { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  cancelledTitle:    { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  cancelledSub:      { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  goBackBtn:         { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: BorderRadius.lg },
  goBackBtnText:     { color: '#fff', fontWeight: '700', fontSize: FontSize.base },

  backBtn:           { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 999, ...Shadow.sm },
  reconnectBanner:   { position: 'absolute', top: 16, left: 72, right: 16, zIndex: 998, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  reconnectText:     { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },
  liveOverlay:       { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  liveDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveText:          { color: '#fff', fontWeight: '800', fontSize: FontSize.xs, letterSpacing: 1 },

  bottomSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 16, paddingBottom: 24, ...Shadow.sm, maxHeight: SCREEN_HEIGHT * 0.52 },
  etaBanner:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  etaLabel:          { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  etaValue:          { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  statusPill:        { backgroundColor: Colors.tealLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  statusPillDone:    { backgroundColor: '#D1FAE5' },
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
