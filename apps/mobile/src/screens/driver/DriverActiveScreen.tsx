import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { transitAPI } from '../../services/api'
import { useDriverLocation } from '../../hooks/useDriverLocation'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

type TransitStatus = 'SCHEDULED' | 'DISPATCHED' | 'ARRIVING' | 'PICKED_UP' | 'AT_ACADEMY' | 'COMPLETED' | 'CANCELLED_BY_USER'

const STEPS: { status: TransitStatus; label: string; icon: string; actionLabel: string }[] = [
  { status: 'DISPATCHED',  label: 'En Route to Pickup',   icon: 'navigate-outline',    actionLabel: 'Mark En Route'    },
  { status: 'ARRIVING',    label: 'Arriving at Pickup',   icon: 'location-outline',    actionLabel: 'Almost There'     },
  { status: 'PICKED_UP',   label: 'Student Picked Up',    icon: 'person-outline',      actionLabel: 'Picked Up'        },
  { status: 'AT_ACADEMY',  label: 'Arrived at Academy',   icon: 'business-outline',    actionLabel: 'At Academy'       },
  { status: 'COMPLETED',   label: 'Session Complete',     icon: 'checkmark-circle',    actionLabel: 'Complete Session' },
]

export default function DriverActiveScreen({ route, navigation }: any) {
  const [session, setSession] = useState<any>(route.params?.session)
  const [updating, setUpdating] = useState(false)
  const isActive = !['COMPLETED', 'CANCELLED_BY_USER'].includes(session?.status)

  useDriverLocation(session?.id ?? null, isActive)

  const student = session?.enrollment?.user
  const academy = session?.enrollment?.slot?.program?.academy
  const pickup  = session?.enrollment?.pickupAddress

  const currentStepIdx = STEPS.findIndex((s) => s.status === session?.status)
  const nextStep = STEPS[currentStepIdx + 1]
  const isFirstStep = !['DISPATCHED', 'ARRIVING', 'PICKED_UP', 'AT_ACADEMY', 'COMPLETED'].includes(session?.status)

  async function updateStatus(status: TransitStatus) {
    setUpdating(true)
    try {
      const updated = await transitAPI.updateDriverStatus(session.id, status)
      setSession({ ...session, status: updated.status })
      if (status === 'COMPLETED') {
        Alert.alert('Session Complete!', 'The student has been successfully dropped off.', [
          { text: 'Back to Home', onPress: () => navigation.goBack() },
        ])
      }
    } catch {
      Alert.alert('Error', 'Could not update status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  function openMapsDirections() {
    if (academy?.lat && academy?.lng) {
      Linking.openURL(`https://www.google.com/maps/?q=${academy.lat},${academy.lng}`)
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D9488', '#1E3A5F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Active Session</Text>
          <Text style={styles.headerSub}>{session?.date ? new Date(session.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}</Text>
        </View>
        {isActive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* Student card */}
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Text style={{ fontSize: 28 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Student</Text>
            <Text style={styles.cardValue}>{student?.name ?? '—'}</Text>
            <Text style={styles.cardSub}>{student?.phone ?? '—'}</Text>
          </View>
          {student?.phone && (
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${student.phone}`)}>
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Pickup card */}
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Text style={{ fontSize: 28 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Pickup Address</Text>
            <Text style={styles.cardValue}>{pickup ?? 'Not specified'}</Text>
          </View>
        </View>

        {/* Academy card */}
        <TouchableOpacity style={styles.card} onPress={openMapsDirections}>
          <View style={styles.cardIcon}>
            <Text style={{ fontSize: 28 }}>🏟️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Destination</Text>
            <Text style={styles.cardValue}>{academy?.name ?? '—'}</Text>
            <Text style={styles.cardSub}>{academy?.address ?? '—'}</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={Colors.primary} />
        </TouchableOpacity>

        {/* Status stepper */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Progress</Text>
          <View style={styles.stepperCard}>
            {STEPS.map((step, i) => {
              const idx = STEPS.findIndex((s) => s.status === session?.status)
              const done = i <= idx
              const current = i === idx
              return (
                <View key={step.status} style={styles.stepRow}>
                  <View style={[styles.stepDot, done && styles.stepDotDone, current && styles.stepDotCurrent]}>
                    {done
                      ? <Ionicons name={current ? step.icon as any : 'checkmark'} size={14} color="#fff" />
                      : <View style={styles.stepDotInner} />
                    }
                  </View>
                  {i < STEPS.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Action buttons */}
        {isActive && (
          <View style={{ gap: 10 }}>
            {isFirstStep && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus('DISPATCHED')} disabled={updating}>
                <LinearGradient colors={[Colors.primary, '#0A6E65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGrad}>
                  <Ionicons name="navigate-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>{updating ? 'Updating...' : 'Start Trip — Mark En Route'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {!isFirstStep && nextStep && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(nextStep.status)} disabled={updating}>
                <LinearGradient colors={[Colors.primary, '#0A6E65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGrad}>
                  <Ionicons name={nextStep.icon as any} size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>{updating ? 'Updating...' : nextStep.actionLabel}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
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
  container:       { flex: 1, backgroundColor: Colors.background },
  header:          { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff' },
  headerSub:       { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  liveBadge:       { marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.accent },
  liveDot:         { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.accent },
  liveText:        { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.accent, letterSpacing: 1 },

  card:            { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, ...Shadow.sm },
  cardIcon:        { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.tealXLight, alignItems: 'center', justifyContent: 'center' },
  cardLabel:       { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue:       { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 2 },
  cardSub:         { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  callBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  section:         { gap: 10 },
  sectionTitle:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepperCard:     { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 20, ...Shadow.sm, gap: 0 },
  stepRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepDot:         { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepDotDone:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDotCurrent:  { backgroundColor: Colors.accent, borderColor: Colors.accent, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  stepDotInner:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepLine:        { position: 'absolute', left: 13, top: 28, width: 2, height: 36, backgroundColor: Colors.border },
  stepLineDone:    { backgroundColor: Colors.primary },
  stepLabel:       { fontSize: FontSize.base, color: Colors.textMuted, paddingTop: 4, paddingBottom: 24 },
  stepLabelDone:   { color: Colors.textPrimary, fontWeight: FontWeight.semibold },

  actionBtn:       { borderRadius: BorderRadius.lg, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  actionBtnGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  actionBtnText:   { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },

  completedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ECFDF5', borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1, borderColor: Colors.accent },
  completedText:   { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#065F46' },
})
