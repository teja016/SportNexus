import React, { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, BorderRadius } from '../../constants/theme'

const HYDERABAD = { lat: 17.385044, lng: 78.486671, address: 'Hyderabad, Telangana' }

export default function LocationSetupScreen() {
  const [manual, setManual]   = useState('')
  const [loading, setLoading] = useState(false)
  const { setLocation } = useAuthStore()

  async function useCurrentLocation() {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocation(HYDERABAD.lat, HYDERABAD.lng, HYDERABAD.address)
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      const address = [geo.name, geo.district, geo.city].filter(Boolean).join(', ') || HYDERABAD.address
      setLocation(loc.coords.latitude, loc.coords.longitude, address)
    } catch {
      setLocation(HYDERABAD.lat, HYDERABAD.lng, HYDERABAD.address)
    } finally {
      setLoading(false)
    }
  }

  function useManual() {
    if (!manual.trim()) { Alert.alert('Please enter your area'); return }
    setLocation(HYDERABAD.lat, HYDERABAD.lng, manual.trim())
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📍</Text>
      <Text style={styles.heading}>Set Your Location</Text>
      <Text style={styles.sub}>We use this to find academies near you</Text>

      <TouchableOpacity style={styles.gpsBtn} onPress={useCurrentLocation} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.gpsBtnText}>📡  Use Current Location</Text>}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.divider} /><Text style={styles.orText}>or</Text><View style={styles.divider} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter your area or city (e.g. Banjara Hills)"
        value={manual}
        onChangeText={setManual}
      />

      <TouchableOpacity style={styles.manualBtn} onPress={useManual}>
        <Text style={styles.manualBtnText}>Continue with Entered Location</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setLocation(HYDERABAD.lat, HYDERABAD.lng, HYDERABAD.address)}>
        <Text style={styles.skipText}>Skip — use Hyderabad as default</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emoji:       { fontSize: 56 },
  heading:     { fontSize: FontSize['2xl'], fontWeight: '800', color: Colors.textPrimary },
  sub:         { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
  gpsBtn:      { backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: BorderRadius.md, alignItems: 'center', width: '100%', marginTop: 8 },
  gpsBtnText:  { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  divider:     { flex: 1, height: 1, backgroundColor: Colors.border },
  orText:      { color: Colors.textSecondary, fontSize: FontSize.sm },
  input:       { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: FontSize.base, width: '100%' },
  manualBtn:   { backgroundColor: Colors.navy, paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: 'center', width: '100%' },
  manualBtnText:{ color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  skipText:    { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 8 },
})
