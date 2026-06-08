import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { MotiView } from 'moti'
import { Ionicons } from '@expo/vector-icons'
import { slotAPI } from '../../services/api'
import { useEnrollmentStore } from '../../store/enrollmentStore'
import { formatCurrency, formatSlotTime, calculateTrainingFee } from '@sportnexus/utils'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'
import StepIndicator from '../../components/StepIndicator'

export default function SlotConfirmScreen({ navigation }: any) {
  const { selectedAcademy, selectedProgram, selectedSlots, durationMonths } = useEnrollmentStore()
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  const trainingFee = selectedProgram
    ? calculateTrainingFee(selectedProgram.feeMonthly, selectedSlots.length || 1, durationMonths)
    : 0

  async function handleCheckAndContinue() {
    if (!selectedSlots.length) { Alert.alert('No slots selected'); return }
    setCheckingAvailability(true)
    try {
      const results = await Promise.all(
        selectedSlots.map((s) => slotAPI.checkAvailability(selectedProgram!.id, s.id))
      )
      const fullSlot = results.find((r) => !r?.available)
      if (fullSlot) {
        Alert.alert('Slot Full', 'One or more selected slots are now full. Please go back and choose different slots.')
        return
      }
      navigation.navigate('TransportOption')
    } catch {
      navigation.navigate('TransportOption')
    } finally {
      setCheckingAvailability(false)
    }
  }

  if (!selectedProgram || !selectedAcademy) return null

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StepIndicator steps={['Schedule', 'Transport', 'Secure']} current={0} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <MotiView from={{ opacity: 0, translateY: -12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18 }}>
          <Text style={styles.heading}>Confirm Your Selection</Text>
        </MotiView>

        {[
          {
            delay: 80, content: (
              <>
                <Text style={styles.cardLabel}>Academy</Text>
                <Text style={styles.cardValue}>{selectedAcademy.name}</Text>
                <View style={styles.divider} />
                <Text style={styles.cardLabel}>Program</Text>
                <Text style={styles.cardValue}>{selectedProgram.name}</Text>
                <Text style={styles.cardSubValue}>Ages {selectedProgram.ageGroupMin}–{selectedProgram.ageGroupMax}</Text>
              </>
            ),
          },
          {
            delay: 160, content: (
              <>
                <Text style={styles.cardLabel}>Selected Slots ({selectedSlots.length})</Text>
                {selectedSlots.map((slot) => (
                  <View key={slot.id} style={styles.slotRow}>
                    <Ionicons name="time-outline" size={16} color={Colors.primary} />
                    <Text style={styles.slotText}>{formatSlotTime(slot.timeStart, slot.timeEnd)}</Text>
                    <Text style={styles.slotDays}>{(slot.daysOfWeek ?? []).slice(0, 3).map((d: string) => d.slice(0,3)).join(', ')}</Text>
                  </View>
                ))}
              </>
            ),
          },
          {
            delay: 240, content: (
              <>
                <Text style={styles.cardLabel}>Duration</Text>
                <Text style={styles.cardValue}>{durationMonths} Month{durationMonths > 1 ? 's' : ''}</Text>
              </>
            ),
          },
          {
            delay: 320, content: (
              <>
                <Text style={styles.cardLabel}>Price Breakdown</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceKey}>Training Fee ({durationMonths} mo × {selectedSlots.length} slot)</Text>
                  <Text style={styles.priceVal}>{formatCurrency(trainingFee)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.priceRow}>
                  <Text style={[styles.priceKey, { fontWeight: '700', color: Colors.textPrimary }]}>Subtotal</Text>
                  <Text style={styles.totalVal}>{formatCurrency(trainingFee)}</Text>
                </View>
                <Text style={styles.transportNote}>+ Transport fee (next step)</Text>
              </>
            ),
          },
        ].map(({ delay, content }, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateY: 24, scale: 0.97 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', delay, damping: 18, stiffness: 150 }}
            style={styles.card}
          >
            {content}
          </MotiView>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Training Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(trainingFee)}</Text>
        </View>
        <TouchableOpacity style={styles.continueBtn} onPress={handleCheckAndContinue} disabled={checkingAvailability}>
          {checkingAvailability
            ? <ActivityIndicator color="#fff" />
            : <><Text style={styles.continueBtnText}>Continue</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  heading:        { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  card:           { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 12, ...Shadow.sm, gap: 6 },
  cardLabel:      { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardSubValue:   { fontSize: FontSize.sm, color: Colors.textSecondary },
  divider:        { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  slotRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  slotText:       { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  slotDays:       { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
  priceRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceKey:       { fontSize: FontSize.sm, color: Colors.textSecondary },
  priceVal:       { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  totalVal:       { fontSize: FontSize.lg, fontWeight: '800', color: Colors.navy },
  transportNote:  { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  bottomBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:     { fontSize: FontSize.sm, color: Colors.textSecondary },
  totalAmount:    { fontSize: FontSize.lg, fontWeight: '800', color: Colors.navy },
  continueBtn:    { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.md, minWidth: 120, justifyContent: 'center' },
  continueBtnText:{ color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
})
