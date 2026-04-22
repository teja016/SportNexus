import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

const HYDERABAD = { lat: 17.385044, lng: 78.486671, address: 'Hyderabad, Telangana' }

export default function LocationSetupScreen() {
  const [manual, setManual]   = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const { setLocation } = useAuthStore()

  const pinScale   = useRef(new Animated.Value(0.8)).current
  const ring1Scale = useRef(new Animated.Value(1)).current
  const ring1Opacity = useRef(new Animated.Value(0.5)).current
  const ring2Scale = useRef(new Animated.Value(1)).current
  const ring2Opacity = useRef(new Animated.Value(0.3)).current
  const slideUp    = useRef(new Animated.Value(40)).current
  const fadeIn     = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pinScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.spring(slideUp,  { toValue: 0, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeIn,   { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()

    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(ring1Scale,   { toValue: 1.8, duration: 1400, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0,   duration: 1400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring1Scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
      ]),
    ])).start()
    Animated.loop(Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(ring2Scale,   { toValue: 1.8, duration: 1400, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0,   duration: 1400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
      ]),
    ])).start()
  }, [])

  async function useCurrentLocation() {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocation(HYDERABAD.lat, HYDERABAD.lng, HYDERABAD.address)
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
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
    if (!manual.trim()) { Alert.alert('Enter your area', 'Please type your area or city.'); return }
    setLocation(HYDERABAD.lat, HYDERABAD.lng, manual.trim())
  }

  return (
    <LinearGradient colors={['#0F172A', '#1E3A5F', '#0D2137']} style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.deco1} />
      <View style={styles.deco2} />

      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

        {/* Pin hero */}
        <View style={styles.pinArea}>
          <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
          <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
          <Animated.View style={[styles.pinCircle, { transform: [{ scale: pinScale }] }]}>
            <LinearGradient colors={[Colors.primary, '#0A6E65']} style={styles.pinGrad}>
              <Text style={{ fontSize: 42 }}>📍</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={styles.heading}>Where are you?</Text>
        <Text style={styles.sub}>We'll find the best sports academies near your location</Text>

        {/* GPS button */}
        <TouchableOpacity style={styles.gpsBtn} onPress={useCurrentLocation} disabled={loading} activeOpacity={0.88}>
          <LinearGradient colors={[Colors.primary, '#0A6E65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gpsBtnGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="locate-outline" size={20} color="#fff" />
                <Text style={styles.gpsBtnText}>Use Current Location</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>or enter manually</Text>
          <View style={styles.divider} />
        </View>

        {/* Manual input */}
        <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
          <Ionicons name="search-outline" size={18} color={focused ? Colors.primary : 'rgba(255,255,255,0.35)'} />
          <TextInput
            style={styles.input}
            placeholder="Area or city (e.g. Banjara Hills)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={manual}
            onChangeText={setManual}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={useManual}
          />
        </View>

        <TouchableOpacity style={styles.manualBtn} onPress={useManual} activeOpacity={0.85}>
          <Text style={styles.manualBtnText}>Continue with this Location</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setLocation(HYDERABAD.lat, HYDERABAD.lng, HYDERABAD.address)} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip — use Hyderabad as default</Text>
        </TouchableOpacity>

      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  deco1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(13,148,136,0.06)', top: -80, right: -80 },
  deco2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(30,58,95,0.4)', bottom: -40, left: -60 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 20 },

  pinArea:  { alignItems: 'center', justifyContent: 'center', height: 140, width: 140 },
  ring:     { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: Colors.primary },
  ring2:    { width: 130, height: 130, borderRadius: 65, borderColor: 'rgba(13,148,136,0.4)' },
  pinCircle:{ shadowColor: Colors.primary, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 28, elevation: 20 },
  pinGrad:  { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

  heading: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  sub:     { fontSize: FontSize.base, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginTop: -8 },

  gpsBtn:     { width: '100%', borderRadius: BorderRadius.lg, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  gpsBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  gpsBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  divider:    { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  orText:     { color: 'rgba(255,255,255,0.35)', fontSize: FontSize.sm },

  inputWrap:       { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  inputWrapFocused:{ borderColor: Colors.primary, backgroundColor: 'rgba(13,148,136,0.12)' },
  input:           { flex: 1, fontSize: FontSize.base, color: '#fff' },

  manualBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.md, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  manualBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.base, fontWeight: FontWeight.semibold },

  skipBtn:  { marginTop: 4 },
  skipText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.3)', textDecorationLine: 'underline' },
})
