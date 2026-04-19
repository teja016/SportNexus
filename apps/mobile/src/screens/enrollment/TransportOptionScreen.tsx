import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useEnrollmentStore } from '../../store/enrollmentStore'
import { useAuthStore } from '../../store/authStore'
import { formatCurrency, calculateTransportFee, calculateDistance } from '@sportnexus/utils'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'

export default function TransportOptionScreen({ navigation }: any) {
  const { setTransport, transportOpted, pickupAddress, pickupDistance, durationMonths, selectedAcademy } = useEnrollmentStore()
  const { userLat, userLng, homeAddress } = useAuthStore()

  const [opted, setOpted]       = useState(transportOpted)
  const [address, setAddress]   = useState(pickupAddress ?? homeAddress ?? '')
  const [distance, setDistance] = useState(pickupDistance > 0 ? pickupDistance : 0)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  // Auto-calculate distance whenever address changes via stored home coords
  useEffect(() => {
    if (userLat && userLng && selectedAcademy) {
      const d = calculateDistance(userLat, userLng, selectedAcademy.lat, selectedAcademy.lng)
      setDistance(d)
    }
  }, [])

  async function useCurrentLocation() {
    if (Platform.OS === 'web') {
      // Use browser Geolocation API on web
      if (!navigator.geolocation) { setLocError('Geolocation not supported'); return }
      setLocating(true)
      setLocError('')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          if (selectedAcademy) {
            const d = calculateDistance(latitude, longitude, selectedAcademy.lat, selectedAcademy.lng)
            setDistance(d)
            setAddress(`Near ${selectedAcademy.city} (GPS location)`)
          }
          setLocating(false)
        },
        () => { setLocError('Could not get location'); setLocating(false) }
      )
    } else {
      setLocating(true)
      setLocError('')
      try {
        const Location = require('expo-location')
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') { setLocError('Location permission denied'); setLocating(false); return }
        const pos = await Location.getCurrentPositionAsync({})
        const { latitude, longitude } = pos.coords
        if (selectedAcademy) {
          const d = calculateDistance(latitude, longitude, selectedAcademy.lat, selectedAcademy.lng)
          setDistance(d)
        }
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude })
        if (geo[0]) {
          const g = geo[0]
          setAddress([g.street, g.district, g.city].filter(Boolean).join(', '))
        }
      } catch {
        setLocError('Could not get location')
      } finally {
        setLocating(false)
      }
    }
  }

  const transportFee = opted && distance > 0
    ? calculateTransportFee(distance, durationMonths)
    : 0

  function handleContinue() {
    if (opted && (!address.trim() || distance <= 0)) return
    setTransport(opted, address.trim(), 0, 0, distance)
    navigation.navigate('Payment')
  }

  const canContinue = !opted || (address.trim().length > 0 && distance > 0)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={styles.heading}>Transport Option</Text>
        <Text style={styles.subHeading}>Choose whether you need pickup & drop service</Text>

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
                {locating ? 'Getting location...' : 'Use Current Location'}
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

            {distance > 0 && (
              <View style={styles.feePreview}>
                <Ionicons name="calculator-outline" size={16} color={Colors.primary} />
                <Text style={styles.feePreviewText}>
                  {distance} km × ₹25 × 26 days × {durationMonths} mo = <Text style={{ fontWeight: '800' }}>{formatCurrency(transportFee)}</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>Transport fee = ₹25 per km × 26 working days × months. Distance is auto-calculated from your location to the academy.</Text>
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
  heading:            { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  subHeading:         { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: 20 },
  optionCard:         { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent', ...Shadow.sm },
  optionCardActive:   { borderColor: Colors.primary, backgroundColor: Colors.tealLight },
  radio:              { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:        { borderColor: Colors.primary },
  radioDot:           { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  optionTitle:        { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  optionDesc:         { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  optionPrice:        { fontSize: FontSize.base, fontWeight: '700', color: Colors.navy },
  detailsCard:        { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 12, ...Shadow.sm, gap: 8 },
  detailsTitle:       { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  inputLabel:         { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  input:              { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: FontSize.base, color: Colors.textPrimary },
  locationBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10 },
  locationBtnText:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  errorText:          { fontSize: FontSize.sm, color: Colors.danger },
  distanceResult:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderRadius: BorderRadius.sm, padding: 10 },
  distanceText:       { fontSize: FontSize.sm, color: Colors.accent },
  feePreview:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.tealLight, borderRadius: BorderRadius.sm, padding: 10 },
  feePreviewText:     { fontSize: FontSize.sm, color: Colors.primary, flex: 1 },
  infoBanner:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  infoText:           { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  bottomBar:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel:           { fontSize: FontSize.sm, color: Colors.textSecondary },
  feeAmount:          { fontSize: FontSize.base, fontWeight: '800', color: Colors.navy },
  continueBtn:        { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.md },
  continueBtnDisabled:{ backgroundColor: Colors.border },
  continueBtnText:    { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
})
