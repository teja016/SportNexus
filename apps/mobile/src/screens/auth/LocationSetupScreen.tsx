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

  const pinScale     = useRef(new Animated.Value(0.8)).current
  const ring1Scale   = useRef(new Animated.Value(1)).current
  const ring1Opacity = useRef(new Animated.Value(0.5)).current
  const ring2Scale   = useRef(new Animated.Value(1)).current
  const ring2Opacity = useRef(new Animated.Value(0.3)).current
  const slideUp      = useRef(new Animated.Value(40)).current
  const fadeIn       = useRef(new Animated.Value(0)).current

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
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroStrip}
      >
        <View style={styles.heroIconBg}>
          <Ionicons name="map-outline" size={32} color="#fff" />
        </View>
        <Text style={styles.heroLabel}>SportNexus</Text>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

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

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>or enter manually</Text>
          <View style={styles.divider} />
        </View>

        <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
          <Ionicons name="search-outline" size={18} color={focused ? Colors.primary : '#9CA3AF'} />
          <TextInput
            style={styles.input}
            placeholder="Area or city (e.g. Banjara Hills)"
            placeholderTextColor="#9CA3AF"
            value={manual}
            onChangeText={setManual}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={useManual}
          />
        </View>

        <TouchableOpacity style={styles.manualBtn} onPress={useManual} activeOpacity={0.85}>
          <Text style={styles.manualBtnText}>Continue with this Location</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setLocation(HYDERABAD.lat, HYDERABAD.lng, HYDERABAD.address)} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip — use Hyderabad as default</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  heroStrip: {
    height: 120, flexDirection: 'row',
    alignItems: 'flex-end', paddingHorizontal: 24, paddingBottom: 20, gap: 12,
  },
  heroIconBg: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: '#fff', letterSpacing: -0.3 },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 20 },

  pinArea:   { alignItems: 'center', justifyContent: 'center', height: 140, width: 140 },
  ring:      { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: Colors.primary },
  ring2:     { width: 130, height: 130, borderRadius: 65, borderColor: Colors.primary + '55' },
  pinCircle: {
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 16,
  },
  pinGrad: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },

  heading: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: -0.5, textAlign: 'center' },
  sub:     { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: -8 },

  gpsBtn: {
    width: '100%', borderRadius: BorderRadius.lg, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  gpsBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  gpsBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  divider:    { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText:     { color: Colors.textMuted, fontSize: FontSize.sm },

  inputWrap:        { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', backgroundColor: '#FFFFFF', borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  inputWrapFocused: { borderColor: Colors.primary, borderWidth: 1.5 },
  input:            { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },

  manualBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  manualBtnText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: FontWeight.semibold },

  skipBtn:  { marginTop: 4 },
  skipText: { fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'underline' },
})
