import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { transitAPI } from '../../services/api'
import { useDriverLocation } from '../../hooks/useDriverLocation'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

type SessionStatus = 'SCHEDULED' | 'DISPATCHED' | 'ARRIVING' | 'AT_ACADEMY' | 'COMPLETED' | 'CANCELLED_BY_USER'
type PassengerStatus = 'WAITING' | 'PICKED_UP' | 'ABSENT'

const DONE_STATUSES: SessionStatus[] = ['COMPLETED', 'CANCELLED_BY_USER']

const TRIP_STEPS: { status: SessionStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'DISPATCHED', label: 'En Route',   icon: 'navigate-outline'  },
  { status: 'ARRIVING',   label: 'Arriving',   icon: 'location-outline'  },
  { status: 'AT_ACADEMY', label: 'At Academy', icon: 'business-outline'  },
  { status: 'COMPLETED',  label: 'Completed',  icon: 'checkmark-circle'  },
]

const NEXT_STATUS: Partial<Record<SessionStatus, { status: SessionStatus; label: string; icon: keyof typeof Ionicons.glyphMap }>> = {
  DISPATCHED: { status: 'ARRIVING',   label: 'Arrived at Pickup',  icon: 'location-outline'  },
  ARRIVING:   { status: 'AT_ACADEMY', label: 'Arrived at Academy', icon: 'business-outline'  },
  AT_ACADEMY: { status: 'COMPLETED',  label: 'Complete Session',   icon: 'checkmark-circle'  },
}

const PASSENGER_STATUS_CONFIG: Record<PassengerStatus, { label: string; color: string; bgColor: string }> = {
  WAITING:   { label: 'Waiting',   color: '#92400E', bgColor: '#FEF3C7' },
  PICKED_UP: { label: 'Picked Up', color: '#065F46', bgColor: '#D1FAE5' },
  ABSENT:    { label: 'Absent',    color: '#991B1B', bgColor: '#FEE2E2' },
}

export default function DriverActiveScreen({ route, navigation }: any) {
  const [session, setSession] = useState<any>(route.params?.session)
  const [updating, setUpdating] = useState(false)
  const [updatingPassenger, setUpdatingPassenger] = useState<string | null>(null)

  const isActive = !DONE_STATUSES.includes(session?.status)
  useDriverLocation(session?.id ?? null, isActive)

  const academy   = session?.slot?.program?.academy
  const slotTime  = session?.slot?.timeStart ?? '—'
  const passengers: any[] = session?.passengers ?? []

  const currentStepIdx = TRIP_STEPS.findIndex((s) => s.status === session?.status)
  const isScheduled     = session?.status === 'SCHEDULED'
  const nextAction      = NEXT_STATUS[session?.status as SessionStatus]

  const formattedDate = session?.date
    ? new Date(session.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : '—'

  async function updateSessionStatus(status: SessionStatus) {
    setUpdating(true)
    try {
      const updated = await transitAPI.updateDriverStatus(session.id, status)
      setSession((prev: any) => ({ ...prev, status: updated.status }))
      if (status === 'COMPLETED') {
        Alert.alert('Session Complete!', 'All passengers have been dropped off at the academy.', [
          { text: 'Back to Home', onPress: () => navigation.goBack() },
        ])
      }
    } catch {
      Alert.alert('Error', 'Could not update session status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  async function updatePassengerStatus(passengerId: string, status: PassengerStatus) {
    setUpdatingPassenger(passengerId)
    try {
      const updated = await transitAPI.updatePassengerStatus(session.id, passengerId, status)
      setSession((prev: any) => ({
        ...prev,
        passengers: prev.passengers.map((p: any) =>
          p.id === passengerId ? { ...p, status: updated.status ?? status } : p
        ),
      }))
    } catch {
      Alert.alert('Error', 'Could not update passenger status. Please try again.')
    } finally {
      setUpdatingPassenger(null)
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D9488', '#1E3A5F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Active Session</Text>
          <Text style={styles.headerSub}>{formattedDate}</Text>
        </View>
        {isActive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sessionInfoCard}>
          <View style={styles.sessionInfoRow}>
            <View style={styles.sessionInfoItem}>
              <Ionicons name="business-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.sessionInfoLabel}>Academy</Text>
            </View>
            <Text style={styles.sessionInfoValue} numberOfLines={1}>{academy?.name ?? '—'}</Text>
          </View>
          <View style={styles.sessionInfoDivider} />
          <View style={styles.sessionInfoRow}>
            <View style={styles.sessionInfoItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.sessionInfoLabel}>Slot</Text>
            </View>
            <Text style={styles.sessionInfoValue}>{slotTime}</Text>
          </View>
          <View style={styles.sessionInfoDivider} />
          <View style={styles.sessionInfoRow}>
            <View style={styles.sessionInfoItem}>
              <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.sessionInfoLabel}>Vehicle</Text>
            </View>
            <Text style={styles.sessionInfoValue}>{session?.vehicleNumber ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.stepperCard}>
          <Text style={styles.sectionLabel}>TRIP PROGRESS</Text>
          <View style={styles.stepperRow}>
            {TRIP_STEPS.map((step, i) => {
              const isDone    = currentStepIdx >= i
              const isCurrent = currentStepIdx === i
              return (
                <React.Fragment key={step.status}>
                  <View style={styles.stepItem}>
                    <View style={[
                      styles.stepCircle,
                      isDone && styles.stepCircleDone,
                      isCurrent && styles.stepCircleCurrent,
                    ]}>
                      {isDone
                        ? <Ionicons name={isCurrent ? step.icon : 'checkmark'} size={12} color="#fff" />
                        : <View style={styles.stepCircleInner} />
                      }
                    </View>
                    <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>{step.label}</Text>
                  </View>
                  {i < TRIP_STEPS.length - 1 && (
                    <View style={[styles.stepConnector, currentStepIdx > i && styles.stepConnectorDone]} />
                  )}
                </React.Fragment>
              )
            })}
          </View>
        </View>

        {isScheduled && (
          <TouchableOpacity
            style={styles.startTripBtn}
            onPress={() => updateSessionStatus('DISPATCHED')}
            disabled={updating}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, '#0A6E65']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startTripGrad}
            >
              <Ionicons name="navigate-outline" size={20} color="#fff" />
              <Text style={styles.startTripText}>{updating ? 'Starting...' : 'Start Trip'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.passengerSection}>
          <Text style={styles.sectionLabel}>
            PASSENGERS ({passengers.length})
          </Text>

          {passengers.length === 0 ? (
            <View style={styles.noPassengers}>
              <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.noPassengersText}>No passengers assigned</Text>
            </View>
          ) : (
            passengers.map((passenger: any) => {
              const cfg           = PASSENGER_STATUS_CONFIG[passenger.status as PassengerStatus] ?? PASSENGER_STATUS_CONFIG.WAITING
              const isWaiting     = passenger.status === 'WAITING'
              const showActions   = isActive && isWaiting
              const isBusy        = updatingPassenger === passenger.id

              return (
                <View key={passenger.id} style={styles.passengerCard}>
                  <View style={styles.passengerCardHeader}>
                    <View style={[styles.stopBadge]}>
                      <Text style={styles.stopBadgeText}>Stop {passenger.stopOrder}</Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: cfg.bgColor }]}>
                      <Text style={[styles.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>

                  <View style={styles.passengerInfo}>
                    <View style={styles.passengerAvatar}>
                      <Ionicons name="person" size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.passengerName}>
                        {passenger.enrollment?.user?.name ?? 'Student'}
                      </Text>
                      <Text style={styles.passengerPhone}>
                        {passenger.enrollment?.user?.phone ?? '—'}
                      </Text>
                    </View>
                    {passenger.enrollment?.user?.phone && (
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => Linking.openURL(`tel:${passenger.enrollment.user.phone}`)}
                      >
                        <Ionicons name="call" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {passenger.enrollment?.pickupAddress ? (
                    <View style={styles.pickupRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.pickupAddr} numberOfLines={2}>
                        {passenger.enrollment.pickupAddress}
                      </Text>
                    </View>
                  ) : null}

                  {showActions && (
                    <View style={styles.passengerActions}>
                      <TouchableOpacity
                        style={[styles.actionChip, styles.actionChipGreen]}
                        onPress={() => updatePassengerStatus(passenger.id, 'PICKED_UP')}
                        disabled={isBusy}
                      >
                        <Ionicons name="checkmark" size={14} color="#065F46" />
                        <Text style={[styles.actionChipText, { color: '#065F46' }]}>
                          {isBusy ? 'Saving...' : 'Picked Up'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionChip, styles.actionChipRed]}
                        onPress={() => updatePassengerStatus(passenger.id, 'ABSENT')}
                        disabled={isBusy}
                      >
                        <Ionicons name="close" size={14} color="#991B1B" />
                        <Text style={[styles.actionChipText, { color: '#991B1B' }]}>
                          Absent
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            })
          )}
        </View>

        {isActive && !isScheduled && nextAction && (
          <TouchableOpacity
            style={styles.advanceBtn}
            onPress={() => updateSessionStatus(nextAction.status)}
            disabled={updating}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, '#0A6E65']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.advanceBtnGrad}
            >
              <Ionicons name={nextAction.icon} size={18} color="#fff" />
              <Text style={styles.advanceBtnText}>
                {updating ? 'Updating...' : nextAction.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {session?.status === 'COMPLETED' && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.accent} />
            <Text style={styles.completedText}>Session completed successfully!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#FFFFFF' },
  header:               { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:              { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:          { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff' },
  headerSub:            { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  liveBadge:            { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.accent },
  liveDot:              { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.accent },
  liveText:             { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.accent, letterSpacing: 1 },

  scrollContent:        { padding: 16, gap: 16, paddingBottom: 48 },
  sectionLabel:         { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  sessionInfoCard:      { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg, padding: 16, ...Shadow.sm },
  sessionInfoRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  sessionInfoItem:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sessionInfoLabel:     { fontSize: FontSize.sm, color: Colors.textMuted },
  sessionInfoValue:     { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  sessionInfoDivider:   { height: 1, backgroundColor: Colors.borderLight },

  stepperCard:          { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg, padding: 16, ...Shadow.sm },
  stepperRow:           { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepItem:             { alignItems: 'center', gap: 6, flex: 1 },
  stepCircle:           { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepCircleDone:       { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepCircleCurrent:    { backgroundColor: Colors.accent, borderColor: Colors.accent, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5 },
  stepCircleInner:      { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepConnector:        { height: 2, flex: 1, backgroundColor: Colors.border, marginTop: 13, marginHorizontal: -4 },
  stepConnectorDone:    { backgroundColor: Colors.primary },
  stepLabel:            { fontSize: 10, color: Colors.textMuted, textAlign: 'center', fontWeight: FontWeight.medium },
  stepLabelDone:        { color: Colors.textPrimary, fontWeight: FontWeight.semibold },

  startTripBtn:         { borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.md },
  startTripGrad:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  startTripText:        { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  passengerSection:     { gap: 0 },
  noPassengers:         { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  noPassengersText:     { fontSize: FontSize.base, color: Colors.textMuted },

  passengerCard:        { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg, padding: 14, marginBottom: 10, ...Shadow.sm, gap: 10 },
  passengerCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stopBadge:            { backgroundColor: Colors.tealXLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  stopBadgeText:        { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  statusChip:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusChipText:       { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  passengerInfo:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerAvatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.tealXLight, alignItems: 'center', justifyContent: 'center' },
  passengerName:        { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  passengerPhone:       { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  callBtn:              { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  pickupRow:            { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingTop: 2 },
  pickupAddr:           { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

  passengerActions:     { flexDirection: 'row', gap: 8 },
  actionChip:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: BorderRadius.md },
  actionChipGreen:      { backgroundColor: '#D1FAE5' },
  actionChipRed:        { backgroundColor: '#FEE2E2' },
  actionChipText:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  advanceBtn:           { borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.md },
  advanceBtnGrad:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  advanceBtnText:       { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },

  completedBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ECFDF5', borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1, borderColor: Colors.accent },
  completedText:        { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#065F46' },
})
