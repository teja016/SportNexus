import React, { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

const SPORT_DECO = [
  { emoji: '🏏', top: 80,  left: -12, size: 52, opacity: 0.18, rotate: '-15deg' },
  { emoji: '⚽', top: 160, right: -8, size: 48, opacity: 0.15, rotate: '10deg'  },
  { emoji: '🥊', top: 260, left: 10,  size: 44, opacity: 0.12, rotate: '-8deg'  },
  { emoji: '🎾', top: 340, right: 14, size: 46, opacity: 0.14, rotate: '20deg'  },
  { emoji: '🏊', top: 440, left: -6,  size: 50, opacity: 0.13, rotate: '-5deg'  },
  { emoji: '🏀', top: 520, right: -4, size: 48, opacity: 0.16, rotate: '12deg'  },
]

function GlassInput({ icon, label, value, onChange, placeholder, keyboardType, autoCapitalize, prefix, maxLength, editable = true }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={inputStyles.wrap}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[inputStyles.row, focused && inputStyles.rowFocused]}>
        {icon && <Ionicons name={icon} size={18} color={focused ? Colors.primary : 'rgba(255,255,255,0.4)'} />}
        {prefix && <Text style={inputStyles.prefix}>{prefix}</Text>}
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  )
}

const inputStyles = StyleSheet.create({
  wrap:       { gap: 8 },
  label:      { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  rowFocused: { borderColor: Colors.primary, backgroundColor: 'rgba(13,148,136,0.12)' },
  prefix:     { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.6)' },
  input:      { flex: 1, fontSize: FontSize.base, color: '#fff' },
})

export default function RegisterScreen({ navigation }: any) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const logoScale = useRef(new Animated.Value(0.8)).current
  const logoOpacity = useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()
  }, [])

  async function handleRegister() {
    if (!name.trim() || !email.trim() || phone.length < 10) {
      setError('Please fill all fields correctly.')
      return
    }
    setError('')
    setLoading(true)
    const fullPhone  = `+91${phone}`
    const emailLower = email.trim().toLowerCase()
    try {
      const res = await authAPI.register({ name: name.trim(), email: emailLower, phone: fullPhone })
      navigation.replace('OTPVerify', { phone: fullPhone, email: res?.email ?? emailLower, flow: 'register' })
    } catch (err: any) {
      if (!err.response) {
        navigation.replace('OTPVerify', { phone: fullPhone, email: emailLower, flow: 'register' })
      } else {
        setError(err.response?.data?.error?.message ?? 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#0F172A', '#1E3A5F', '#0D2137']} style={styles.bg}>
      {/* Floating sport decorations */}
      {SPORT_DECO.map((d, i) => (
        <Text
          key={i}
          style={{
            position: 'absolute', top: d.top,
            ...(d.left !== undefined ? { left: d.left } : { right: (d as any).right }),
            fontSize: d.size, opacity: d.opacity,
            transform: [{ rotate: d.rotate }],
          }}
        >{d.emoji}</Text>
      ))}

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Hero */}
        <Animated.View style={[styles.heroWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <LinearGradient colors={[Colors.primary, Colors.navy]} style={styles.heroGlow}>
            <Text style={{ fontSize: 40 }}>🏆</Text>
          </LinearGradient>
          <View style={styles.heroRing} />
        </Animated.View>

        <Text style={styles.heading}>Join SportNexus</Text>
        <Text style={styles.sub}>Book your spot at elite sports academies near you</Text>

        {/* Form glass card */}
        <View style={styles.card}>
          <GlassInput icon="person-outline" label="Full Name" value={name} onChange={setName} placeholder="Rahul Sharma" autoCapitalize="words" />
          <GlassInput icon="mail-outline" label="Email Address" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <GlassInput icon="call-outline" label="Phone Number" value={phone} onChange={(t: string) => setPhone(t.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" keyboardType="phone-pad" maxLength={10} prefix="+91" />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#FCA5A5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.88}>
          <LinearGradient colors={[Colors.primary, '#0A6E65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.btnText}>Send OTP</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Text style={styles.switchLink}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  bg:       { flex: 1 },
  scroll:   { flexGrow: 1, padding: 24, paddingTop: 56, paddingBottom: 48, gap: 20, alignItems: 'center' },
  backBtn:  { alignSelf: 'flex-start', width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8, position: 'relative' },
  heroGlow: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 28, elevation: 20 },
  heroRing: { position: 'absolute', width: 116, height: 116, borderRadius: 36, borderWidth: 1.5, borderColor: 'rgba(13,148,136,0.3)' },
  heading:  { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  sub:      { fontSize: FontSize.base, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22, marginTop: -8 },
  card:     { width: '100%', gap: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: BorderRadius.xl, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: BorderRadius.md, padding: 12, width: '100%', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText:{ fontSize: FontSize.sm, color: '#FCA5A5', flex: 1 },
  btn:      { width: '100%', borderRadius: BorderRadius.lg, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  btnGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  btnText:  { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  switchBtn:{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  switchText:{ fontSize: FontSize.base, color: 'rgba(255,255,255,0.45)' },
  switchLink:{ fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
})
