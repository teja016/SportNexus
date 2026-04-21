import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Platform, FlatList,
} from 'react-native'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useEnrollmentStore } from '../../store/enrollmentStore'
import { useAuthStore } from '../../store/authStore'
import {
  formatCurrency, calculateDistance,
  calculateProratedTransportFee, calculateTransportFee,
} from '@sportnexus/utils'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'

// Build next 14 days starting from tomorrow
function buildDateChips(): Date[] {
  const chips: Date[] = []
  const today = new Date()
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    chips.push(d)
  }
  return chips
}

const DATE_CHIPS = buildDateChips()
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function TransportOptionScreen({ navigation }: any) {
  const {
    setTransport, setStartDate, transportOpted, pickupAddress,
    pickupDistance, durationMonths, selectedAcademy,
  } = useEnrollmentStore()
  const { userLat, userLng, homeAddress, setLocation } = useAuthStore()

  const [opted, setOpted]           = useState(transportOpted)
  const [address, setAddress]       = useState(pickupAddress ?? homeAddress ?? '')
  const [distance, setDistance]     = useState(pickupDistance > 0 ? pickupDistance : 0)
  const [locating, setLocating]     = useState(false)
  const [locError, setLocError]     = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(DATE_CHIPS[0])

  useEffect(() => {
    async function initLocation() {
      if (userLat && userLng && selectedAcademy) {
        setDistance(calculateDistance(userLat, userLng, selectedAcademy.lat, selectedAcademy.lng))
      }
      if (Platform.OS === 'web') return
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') return
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        const { latitude, longitude } = pos.coords
        if (selectedAcademy) {
          setDistance(calculateDistance(latitude, longitude, selectedAcademy.lat, selectedAcademy.lng))
        }
        const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude })
        if (geo) {
          const freshAddress = [geo.name, geo.district, geo.city].filter(Boolean).join(', ')
          if (freshAddress) setAddress(freshAddress)
        }
        setLocation(latitude, longitude, address || homeAddress || '')
      } catch { /* silent */ }
    }
    initLocation()
  }, [])

  async function useCurrentLocation() {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) { setLocError('Geolocation not supported'); return }
      setLocating(true); setLocError('')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          if (selectedAcademy) {
            setDistance(calculateDistance(latitude, longitude, selectedAcademy.lat, selectedAcademy.lng))
            setAddress(`Near ${selectedAcademy.city} (GPS location)`)
          }
          setLocating(false)
        },
        () => { setLocError('Could not get location'); setLocating(false) }
      )
      return
    }
    setLocating(true); setLocError('')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setLocError('Location permission denied'); return }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const { latitude, longitude } = pos.coords
      if (selectedAcademy) {
        setDistance(calculateDistance(latitude, longitude, selectedAcademy.lat, selectedAcademy.lng))
      }
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (geo) {
        const fresh = [geo.name, geo.district, geo.city].filter(Boolean).join(', ')
        setAddress(fresh || 'Current Location')
        setLocation(latitude, longitude, fresh || 'Current Location')
      }
    } catch { setLocError('Could not get location') }
    finally { setLocating(false) }
  }

  const breakdown = opted && distance > 0 && selectedDate
    ? calculateProratedTransportFee(selectedDate, durationMonths, distance)
    : null

  const transportFee = breakdown?.total ?? 0

  function handleContinue() {
    if (opted && (!address.trim() || distance <= 0)) return
    setTransport(opted, address.trim(), 0, 0, distance)
    if (opted && selectedDate) setStartDate(selectedDate)
    navigation.navigate('Payment')
  }

  const canContinue = !opted || (address.trim().length > 0 && distance > 0)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
        <Text style={styles.heading}>Transport Option</Text>
        <Text style={styles.subHeading}>Choose whether you need pickup & drop service</Text>

        {/* Self / Transport option cards */}
        <TouchableOpacity style={[styles.optionCard, !opted && styles.optionCardActive]} onPress={() => setOpted(false)}>
          <View style={[styles.radio, !opted && styles.radioActive]}>
            {!opted && <View style={styles.radioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Self Transport</Text>
            <Text style={styles.optionDesc}>I'll manage my own commute to the academy</Text>
          </View>
          <Text style={styles.optionPrice}>Free</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, opted && styles.optionCardActive]} onPress={() => setOpted(true)}>
          <View style={[styles.radio, opted && styles.radioActive]}>
            {opted && <View style={styles.radioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>🚌 Pickup & Drop</Text>
            <Text style={styles.optionDesc}>Door-to-door transport by the academy</Text>
          </View>
          <Text style={styles.optionPrice}>₹25/km</Text>
        </TouchableOpacity>

        {opted && (
          <>
            {/* ── Pickup Address ─────────────────────────────── */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Pickup Details</Text>

              <Text style={styles.inputLabel}>Pickup Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your pickup address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity style={styles.locationBtn} onPress={useCurrentLocation} disabled={locating}>
                {locating
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <Ionicons name="locate-outline" size={16} color={Colors.primary} />}
                <Text style={styles.locationBtnText}>
                  {locating ? 'Getting location...' : 'Refresh Current Location'}
                </Text>
              </TouchableOpacity>

              {!!locError && <Text style={styles.errorText}>{locError}</Text>}

              {distance > 0 && (
                <View style={styles.distanceResult}>
                  <Ionicons name="map-outline" size={16} color={Colors.accent} />
                  <Text style={styles.distanceText}>
                    Distance to academy: <Text style={{ fontWeight: '800' }}>{distance} km</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* ── Start Date Picker ──────────────────────────── */}
            <View style={styles.sectionCard}>
              <Text style={styles.detailsTitle}>When do you want to start?</Text>
              <Text style={styles.sectionSubtitle}>
                Transport fee for the first month is calculated based on days remaining.
              </Text>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={DATE_CHIPS}
                keyExtractor={(d) => d.toISOString()}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                renderItem={({ item: d }) => {
                  const isSelected =
                    d.getDate() === selectedDate.getDate() &&
                    d.getMonth() === selectedDate.getMonth()
                  const isToday = false // chips start from tomorrow
                  return (
                    <TouchableOpacity
                      style={[styles.dateChip, isSelected && styles.dateChipActive]}
                      onPress={() => setSelectedDate(d)}
                    >
                      <Text style={[styles.dateChipDay, isSelected && styles.dateChipTextActive]}>
                        {DAY_NAMES[d.getDay()]}
                      </Text>
                      <Text style={[styles.dateChipNum, isSelected && styles.dateChipTextActive]}>
                        {d.getDate()}
                      </Text>
                      <Text style={[styles.dateChipMonth, isSelected && styles.dateChipTextActive]}>
                        {MONTH_SHORT[d.getMonth()]}
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />
            </View>

            {/* ── Fee Breakdown ──────────────────────────────── */}
            {breakdown && (
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownHeader}>
                  <Ionicons name="calculator-outline" size={16} color={Colors.primary} />
                  <Text style={styles.breakdownTitle}>Transport Fee Breakdown</Text>
                </View>

                <View style={styles.breakdownTableHeader}>
                  <Text style={[styles.breakdownCol, { flex: 2 }]}>Period</Text>
                  <Text style={[styles.breakdownCol, styles.breakdownColRight]}>Days</Text>
                  <Text style={[styles.breakdownCol, styles.breakdownColRight]}>Fee</Text>
                </View>

                {breakdown.items.map((item, idx) => (
                  <View key={idx} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownCell, { flex: 2 }]} numberOfLines={1}>{item.label}</Text>
                    <Text style={[styles.breakdownCell, styles.breakdownCellRight]}>{item.days}</Text>
                    <Text style={[styles.breakdownCell, styles.breakdownCellRight]}>{formatCurrency(item.fee)}</Text>
                  </View>
                ))}

                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownTotalRow}>
                  <Text style={styles.breakdownTotalLabel}>
                    Total ({durationMonths} month{durationMonths > 1 ? 's' : ''})
                  </Text>
                  <Text style={styles.breakdownTotalAmount}>{formatCurrency(breakdown.total)}</Text>
                </View>

                <View style={styles.endDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.endDateText}>
                    Ends on{' '}
                    <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>
                      {breakdown.endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            Transport = ₹25/km × 2 (round trip) × Mon–Sat working days. Sundays are excluded. First month is prorated from your start date.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {opted && transportFee > 0 && (
          <View>
            <Text style={styles.feeLabel}>Transport Fee</Text>
            <Text style={styles.feeAmount}>{formatCurrency(transportFee)}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueBtnText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  heading:          { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  subHeading:       { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: 20 },

  optionCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent', ...Shadow.sm },
  optionCardActive: { borderColor: Colors.primary, backgroundColor: Colors.tealLight },
  radio:            { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:      { borderColor: Colors.primary },
  radioDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  optionTitle:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  optionDesc:       { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  optionPrice:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy },

  detailsCard:      { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 12, ...Shadow.sm, gap: 8 },
  detailsTitle:     { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  inputLabel:       { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  input:            { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: FontSize.base, color: Colors.textPrimary },
  locationBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10 },
  locationBtnText:  { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  errorText:        { fontSize: FontSize.sm, color: Colors.danger },
  distanceResult:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderRadius: BorderRadius.sm, padding: 10 },
  distanceText:     { fontSize: FontSize.sm, color: Colors.accent },

  sectionCard:      { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 12, ...Shadow.sm, gap: 8 },
  sectionSubtitle:  { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  dateChip:         { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background, minWidth: 52 },
  dateChipActive:   { borderColor: Colors.primary, backgroundColor: Colors.tealLight },
  dateChipDay:      { fontSize: 10, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase' },
  dateChipNum:      { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, lineHeight: 24 },
  dateChipMonth:    { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  dateChipTextActive: { color: Colors.primary },

  breakdownCard:    { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 12, ...Shadow.sm },
  breakdownHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  breakdownTitle:   { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  breakdownTableHeader: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, marginBottom: 4 },
  breakdownCol:     { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  breakdownColRight:{ flex: 1, textAlign: 'right' },
  breakdownRow:     { flexDirection: 'row', paddingVertical: 6 },
  breakdownCell:    { fontSize: FontSize.sm, color: Colors.textPrimary },
  breakdownCellRight: { flex: 1, textAlign: 'right', color: Colors.textSecondary },
  breakdownDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 8 },
  breakdownTotalRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownTotalLabel: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  breakdownTotalAmount: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.navy },
  endDateRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, padding: 8 },
  endDateText:      { fontSize: FontSize.xs, color: Colors.textMuted },

  infoBanner:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  infoText:         { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel:         { fontSize: FontSize.sm, color: Colors.textSecondary },
  feeAmount:        { fontSize: FontSize.base, fontWeight: '800', color: Colors.navy },
  continueBtn:      { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.md },
  continueBtnDisabled: { backgroundColor: Colors.border },
  continueBtnText:  { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
})
