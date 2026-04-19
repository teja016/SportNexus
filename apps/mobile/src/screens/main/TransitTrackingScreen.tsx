import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Linking, ScrollView, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/authStore'
import { useLocalEnrollmentsStore } from '../../store/localEnrollmentsStore'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'
import TrackingMap from '../../components/TrackingMap'
import DriverDetailModal, { DriverDetails } from '../../components/DriverDetailModal'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const STATUS_STEPS = [
  { key: 'SCHEDULED',      label: 'Scheduled',      icon: 'time-outline' },
  { key: 'DISPATCHED',     label: 'Driver Assigned', icon: 'car-outline' },
  { key: 'ARRIVING',       label: 'On the Way',      icon: 'navigate-outline' },
  { key: 'PICKED_UP',      label: 'Picked Up',       icon: 'person-outline' },
  { key: 'AT_ACADEMY',     label: 'At Academy',      icon: 'school-outline' },
  { key: 'COMPLETED',      label: 'Completed',       icon: 'checkmark-circle-outline' },
]

// Simulate driver moving toward pickup
function useSimulatedDriver(pickupLat: number, pickupLng: number) {
  const [driverPos, setDriverPos] = useState({
    lat: pickupLat + 0.012,
    lng: pickupLng - 0.008,
  })
  const [status, setStatus] = useState('DISPATCHED')
  const [eta, setEta]       = useState(8)

  useEffect(() => {
    let step = 0
    const totalSteps = 40
    const startLat = pickupLat + 0.012
    const startLng = pickupLng - 0.008

    const interval = setInterval(() => {
      step++
      const progress = step / totalSteps
      const newLat = startLat + (pickupLat - startLat) * progress
      const newLng = startLng + (pickupLng - startLng) * progress
      setDriverPos({ lat: newLat, lng: newLng })
      setEta(Math.max(1, Math.round(8 * (1 - progress))))

      if (progress > 0.3 && status === 'DISPATCHED') setStatus('ARRIVING')
      if (progress >= 1) {
        setStatus('PICKED_UP')
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [pickupLat, pickupLng])

  return { driverPos, status, eta }
}

export default function TransitTrackingScreen({ route, navigation }: any) {
  const { enrollmentId } = route.params ?? {}
  const { userLat, userLng } = useAuthStore()
  const { enrollments } = useLocalEnrollmentsStore()

  const enrollment = enrollments.find((e) => e.id === enrollmentId) ?? enrollments[0]
  const academy    = (enrollment as any)?.slot?.program?.academy

  // Coordinates
  const pickupLat = userLat ?? 17.4337
  const pickupLng = userLng ?? 78.4076
  const destLat   = academy?.lat ?? 17.4156
  const destLng   = academy?.lng ?? 78.4347

  const { driverPos, status, eta } = useSimulatedDriver(pickupLat, pickupLng)

  const [showDriver, setShowDriver] = useState(false)

  const driverDetails: DriverDetails = {
    name:          'Rajesh Kumar',
    phone:         '+919876543210',
    vehicleNumber: 'TS 09 AB 1234',
    vehicleModel:  'Maruti Suzuki Alto K10',
    vehicleColor:  'White',
    licenseNumber: 'TSDL-09-20150123456',
    aadharLast4:   '7842',
  }

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === status)
  const isLive = ['ARRIVING', 'PICKED_UP'].includes(status)

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

  function callDriver() {
    Linking.openURL('tel:+919876543210')
  }

  return (
    <View style={styles.container}>
      {/* Back button overlay */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Full-screen Map */}
      <View style={styles.mapContainer}>
        <TrackingMap
          driverLat={driverPos.lat}
          driverLng={driverPos.lng}
          pickupLat={pickupLat}
          pickupLng={pickupLng}
          destLat={destLat}
          destLng={destLng}
          status={status}
          onDriverPress={() => setShowDriver(true)}
        />
      </View>

      {/* Live badge overlay on map */}
      {isLive && (
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
              {status === 'PICKED_UP' ? 'En route to Academy' :
               status === 'AT_ACADEMY' ? 'Arrived!' :
               `${eta} min away`}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{STATUS_STEPS[currentStep]?.label ?? status}</Text>
          </View>
        </View>

        {/* Driver Card */}
        <TouchableOpacity style={styles.driverCard} onPress={() => setShowDriver(true)} activeOpacity={0.8}>
          <View style={styles.driverAvatar}>
            <Text style={{ fontSize: 26 }}>👨‍✈️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{driverDetails.name}</Text>
            <Text style={styles.vehicleNum}>{driverDetails.vehicleNumber} · {driverDetails.vehicleColor} {driverDetails.vehicleModel.split(' ').slice(-1)[0]}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.callBtn} onPress={callDriver}>
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoBtn} onPress={() => setShowDriver(true)}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Progress Steps */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepsScroll}
          contentContainerStyle={styles.stepsRow}>
          {STATUS_STEPS.map((step, idx) => {
            const done    = idx < currentStep
            const current = idx === currentStep
            return (
              <View key={step.key} style={styles.stepItem}>
                <View style={[styles.stepDot,
                  done    && styles.stepDotDone,
                  current && styles.stepDotCurrent,
                ]}>
                  {done ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : (
                    <Ionicons name={step.icon as any} size={12} color={current ? '#fff' : Colors.textMuted} />
                  )}
                </View>
                {idx < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, done && styles.stepLineDone]} />
                )}
                <Text style={[styles.stepLabel, current && styles.stepLabelActive]}
                  numberOfLines={1}>{step.label}</Text>
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
      </View>
      {showDriver && (
        <DriverDetailModal driver={driverDetails} onClose={() => setShowDriver(false)} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  mapContainer:     { flex: 1 },
  backBtn:          { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 999, ...Shadow.sm },
  liveOverlay:      { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  liveDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveText:         { color: '#fff', fontWeight: '800', fontSize: FontSize.xs, letterSpacing: 1 },
  bottomSheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 16, paddingBottom: 24, ...Shadow.sm, maxHeight: SCREEN_HEIGHT * 0.48 },
  etaBanner:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  etaLabel:         { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  etaValue:         { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  statusPill:       { backgroundColor: Colors.tealLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  statusPillText:   { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },
  driverCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  driverAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  driverName:       { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  vehicleNum:       { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  callBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  infoBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  stepsScroll:      { marginTop: 14 },
  stepsRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 4, gap: 0 },
  stepItem:         { alignItems: 'center', flexDirection: 'row' },
  stepDot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotDone:      { backgroundColor: Colors.accent },
  stepDotCurrent:   { backgroundColor: Colors.primary },
  stepLine:         { width: 28, height: 2, backgroundColor: Colors.border },
  stepLineDone:     { backgroundColor: Colors.accent },
  stepLabel:        { position: 'absolute', top: 30, fontSize: 9, color: Colors.textMuted, width: 56, textAlign: 'center', left: -14 },
  stepLabelActive:  { color: Colors.primary, fontWeight: '700' },
  routeRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
  routePoint:       { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  routeDot:         { width: 10, height: 10, borderRadius: 5 },
  routeText:        { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  routeDash:        { width: 20, height: 1, backgroundColor: Colors.border },
})
