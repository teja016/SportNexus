import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { slotAPI } from '../../services/api'
import { MOCK_SLOTS } from '../../constants/mockData'
import { useEnrollmentStore } from '../../store/enrollmentStore'
import { formatSlotTime, formatCurrency, isMorningSlot, calculateTrainingFee, calculateTotalFee } from '@sportnexus/utils'
import { Slot, SportProgram, Academy } from '@sportnexus/types'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow, SportColors } from '../../constants/theme'

const DURATIONS = [1, 3, 6, 12]

export default function SlotsScreen({ route, navigation }: any) {
  const { program, academy }: { program: SportProgram; academy: Academy } = route.params
  const { setProgram, setSlots, setDuration, selectedSlots, durationMonths } = useEnrollmentStore()

  const [localDuration, setLocalDuration] = useState(durationMonths || 1)

  const { data, isLoading } = useQuery({
    queryKey: ['slots', program.id],
    queryFn: () => slotAPI.getByProgram(program.id),
    staleTime: 0,
  })

  const slots: Slot[] = Array.isArray(data) && data.length > 0 ? data : (data === undefined ? MOCK_SLOTS : [])
  const morningSlots = slots.filter((s) => isMorningSlot(s.timeStart))

  // Scrub any stale slot IDs (e.g. mock IDs from a previous session) once real slots load
  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      const validIds = new Set(data.map((s) => s.id))
      const clean = selectedSlots.filter((s) => validIds.has(s.id))
      if (clean.length !== selectedSlots.length) setSlots(clean)
    }
  }, [data])
  const eveningSlots = slots.filter((s) => !isMorningSlot(s.timeStart))

  const toggleSlot = useCallback((slot: Slot) => {
    const isSelected = selectedSlots.some((s) => s.id === slot.id)
    setSlots(isSelected
      ? selectedSlots.filter((s) => s.id !== slot.id)
      : [...selectedSlots, slot]
    )
  }, [selectedSlots, setSlots])

  const handleContinue = useCallback(() => {
    if (selectedSlots.length === 0) return
    setProgram(program)
    setDuration(localDuration)
    navigation.navigate('SlotConfirm')
  }, [selectedSlots, program, localDuration, setProgram, setDuration, navigation])

  const trainingFee = useMemo(
    () => selectedSlots.length > 0
      ? calculateTrainingFee(program.feeMonthly, selectedSlots.length, localDuration)
      : 0,
    [selectedSlots.length, program.feeMonthly, localDuration]
  )

  const sportColor = SportColors[program.sportType] ?? Colors.primary

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Program Info */}
        <View style={styles.programInfo}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programMeta}>Ages {program.ageGroupMin}–{program.ageGroupMax} · {formatCurrency(program.feeMonthly)}/month</Text>
        </View>

        {/* Duration */}
        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationChip, localDuration === d && styles.durationChipActive]}
              onPress={() => setLocalDuration(d)}
            >
              <Text style={[styles.durationText, localDuration === d && styles.durationTextActive]}>
                {d} {d === 1 ? 'Month' : 'Months'}
              </Text>
              {d >= 3 && (
                <Text style={[styles.discountText, localDuration === d && { color: 'rgba(255,255,255,0.8)' }]}>
                  {d === 3 ? '5% off' : d === 6 ? '10% off' : '15% off'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Morning Slots */}
        {morningSlots.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🌅 Morning Slots</Text>
            <View style={styles.slotsGrid}>
              {morningSlots.map((slot) => {
                const isSelected = selectedSlots.some((s) => s.id === slot.id)
                const isFull = slot.enrolledCount >= slot.totalCapacity
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotCard, isSelected && styles.slotCardSelected, isFull && styles.slotCardFull]}
                    onPress={() => !isFull && toggleSlot(slot)}
                    disabled={isFull}
                    activeOpacity={isFull ? 1 : 0.8}
                  >
                    {isSelected && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={styles.checkIcon} />}
                    <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                      {formatSlotTime(slot.timeStart, slot.timeEnd)}
                    </Text>
                    <Text style={styles.slotDays}>{slot.daysOfWeek.map((d: string) => d.slice(0, 3)).join(', ')}</Text>
                    <View style={styles.capacityRow}>
                      <View style={[styles.capacityBar, { width: `${Math.min((slot.enrolledCount / slot.totalCapacity) * 100, 100)}%` as any }]} />
                    </View>
                    <Text style={styles.capacityText}>
                      {isFull ? 'Full' : `${slot.totalCapacity - slot.enrolledCount} seats left`}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </>
        )}

        {/* Evening Slots */}
        {eveningSlots.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🌆 Evening Slots</Text>
            <View style={styles.slotsGrid}>
              {eveningSlots.map((slot) => {
                const isSelected = selectedSlots.some((s) => s.id === slot.id)
                const isFull = slot.enrolledCount >= slot.totalCapacity
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.slotCard, isSelected && styles.slotCardSelected, isFull && styles.slotCardFull]}
                    onPress={() => !isFull && toggleSlot(slot)}
                    disabled={isFull}
                    activeOpacity={isFull ? 1 : 0.8}
                  >
                    {isSelected && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={styles.checkIcon} />}
                    <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                      {formatSlotTime(slot.timeStart, slot.timeEnd)}
                    </Text>
                    <Text style={styles.slotDays}>{slot.daysOfWeek.map((d: string) => d.slice(0, 3)).join(', ')}</Text>
                    <View style={styles.capacityRow}>
                      <View style={[styles.capacityBar, { width: `${Math.min((slot.enrolledCount / slot.totalCapacity) * 100, 100)}%` as any }]} />
                    </View>
                    <Text style={styles.capacityText}>
                      {isFull ? 'Full' : `${slot.totalCapacity - slot.enrolledCount} seats left`}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </>
        )}

        {slots.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🗓</Text>
            <Text style={styles.emptyText}>No slots available right now</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Summary */}
      {selectedSlots.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.selectedCount}>{selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected</Text>
            <Text style={styles.totalFee}>{formatCurrency(trainingFee)} for {localDuration} month{localDuration > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  loading:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  programInfo:       { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 16, ...Shadow.sm },
  programName:       { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  programMeta:       { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  sectionTitle:      { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 10, marginTop: 12 },
  durationRow:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  durationChip:      { flex: 1, minWidth: 70, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, padding: 10, alignItems: 'center', ...Shadow.xs },
  durationChipActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText:      { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  durationTextActive:{ color: '#fff' },
  discountText:      { fontSize: FontSize.xs, color: Colors.accent, marginTop: 2, fontWeight: FontWeight.semibold },
  slotsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  slotCard:          { width: '47%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, padding: 12, position: 'relative', ...Shadow.xs },
  slotCardSelected:  { borderColor: Colors.primary, backgroundColor: Colors.tealXLight },
  slotCardFull:      { opacity: 0.45 },
  checkIcon:         { position: 'absolute', top: 8, right: 8 },
  slotTime:          { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  slotTimeSelected:  { color: Colors.primary },
  slotDays:          { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },
  capacityRow:       { height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  capacityBar:       { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  capacityText:      { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  empty:             { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyText:         { fontSize: FontSize.base, color: Colors.textSecondary },
  bottomBar:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 },
  selectedCount:     { fontSize: FontSize.sm, color: Colors.textSecondary },
  totalFee:          { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.navy },
  continueBtn:       { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 13, borderRadius: BorderRadius.lg, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  continueBtnText:   { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
})
