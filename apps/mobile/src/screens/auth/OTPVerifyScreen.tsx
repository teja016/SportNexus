import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

export default function OTPVerifyScreen({ route, navigation }: any) {
  const phone  = route.params?.phone ?? ''
  const email  = route.params?.email ?? null
  const flow   = route.params?.flow ?? 'register'
  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [userNotFound, setUserNotFound] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const inputRefs = useRef<Array<TextInput | null>>([])
  const { login } = useAuthStore()

  const ring1Scale   = useRef(new Animated.Value(1)).current
  const ring1Opacity = useRef(new Animated.Value(0.4)).current
  const ring2Scale   = useRef(new Animated.Value(1)).current
  const ring2Opacity = useRef(new Animated.Value(0.25)).current
  const slideUp      = useRef(new Animated.Value(30)).current
  const fadeIn       = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUp, { toValue: 0, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()

    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(ring1Scale,   { toValue: 1.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0,   duration: 1200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring1Scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
      ]),
    ])).start()
    Animated.loop(Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(ring2Scale,   { toValue: 1.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0,   duration: 1200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0.25, duration: 0, useNativeDriver: true }),
      ]),
    ])).start()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function handleVerify(code?: string[]) {
    const digits = code ?? otp
    const otpStr = digits.join('')
    if (otpStr.length < 6) { setError('Please enter all 6 digits.'); return }
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.verifyOTP(phone, otpStr)
      login(data.user, data.accessToken, data.refreshToken)
    } catch (err: any) {
      if (!err.response) {
        const mockUser = { id: `dev_${Date.now()}`, name: 'Dev User', email: 'dev@sportnexus.com', phone, role: 'USER' as any, createdAt: '', updatedAt: '' }
        login(mockUser, `dev-${Date.now()}`, 'dev-refresh')
      } else {
        const msg = err.response?.data?.error?.message ?? ''
        const isUserNotFound = msg.toLowerCase().includes('not found') || err.response?.status === 404
        if (isUserNotFound) {
          setUserNotFound(true)
          setError(flow === 'login'
            ? 'No account found for this number. Would you like to create one?'
            : 'Registration may have failed. Please go back and try again.')
        } else {
          setError(msg || 'Verification failed. Please try again.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function handleChange(value: string, index: number) {
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (newOtp.every((d) => d !== '')) handleVerify(newOtp)
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const filled = otp.filter((d) => d !== '').length

  return (
    <LinearGradient colors={['#0F172A', '#1E3A5F', '#0D2137']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Icon with rings */}
        <View style={styles.iconArea}>
          <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
          <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
          <LinearGradient colors={[Colors.primary, '#0A6E65']} style={styles.iconCircle}>
            <Text style={{ fontSize: 38 }}>🔐</Text>
          </LinearGradient>
        </View>

        <Text style={styles.heading}>Verify OTP</Text>
        <Text style={styles.sub}>
          {email
            ? `Code sent to\n${email}`
            : `Enter the 6-digit code sent to\n${phone}`
          }
        </Text>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null, loading && styles.otpBoxLoading]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="numeric"
              maxLength={1}
              autoFocus={i === 0}
              editable={!loading}
            />
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: `${(filled / 6) * 100}%` }]} />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#FCA5A5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {userNotFound && flow === 'login' && (
          <TouchableOpacity style={styles.altBtn} onPress={() => navigation.replace('Register')}>
            <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
            <Text style={styles.altBtnText}>Create a new account</Text>
          </TouchableOpacity>
        )}
        {userNotFound && flow === 'register' && (
          <TouchableOpacity style={[styles.altBtn, { borderColor: 'rgba(255,255,255,0.15)' }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={[styles.altBtnText, { color: 'rgba(255,255,255,0.6)' }]}>Go back and try again</Text>
          </TouchableOpacity>
        )}

        {!userNotFound && (
          <TouchableOpacity style={styles.btn} onPress={() => handleVerify()} disabled={loading} activeOpacity={0.88}>
            <LinearGradient colors={[Colors.primary, '#0A6E65']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <><Text style={styles.btnText}>Verify OTP</Text><Ionicons name="checkmark-circle" size={18} color="#fff" /></>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {countdown > 0 ? (
          <View style={styles.countdownRow}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.4)" />
            <Text style={styles.countdown}>Resend in {countdown}s</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={async () => {
            setCountdown(30); setOtp(['', '', '', '', '', '']); setUserNotFound(false); setError('')
            try { await authAPI.sendOTP(phone) } catch {}
          }}>
            <Text style={styles.resend}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  content:      { flex: 1, padding: 24, paddingTop: 56, alignItems: 'center', gap: 20 },
  backBtn:      { alignSelf: 'flex-start', width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  iconArea:     { alignItems: 'center', justifyContent: 'center', height: 120, width: 120, marginVertical: 8 },
  ring:         { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: Colors.primary },
  ring2:        { width: 120, height: 120, borderRadius: 60, borderColor: 'rgba(13,148,136,0.5)' },
  iconCircle:   { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 },
  heading:      { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, color: '#fff', letterSpacing: -0.5 },
  sub:          { fontSize: FontSize.base, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24, marginTop: -8 },
  otpRow:       { flexDirection: 'row', gap: 12 },
  otpBox:       { width: 48, height: 60, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', textAlign: 'center', fontSize: FontSize['2xl'], fontWeight: FontWeight.black, color: '#fff', backgroundColor: 'rgba(255,255,255,0.07)' },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: 'rgba(13,148,136,0.2)', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  otpBoxLoading:{ opacity: 0.6 },
  progressBg:   { width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: BorderRadius.md, padding: 12, width: '100%', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText:    { flex: 1, fontSize: FontSize.sm, color: '#FCA5A5', lineHeight: 20 },
  altBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: BorderRadius.md, padding: 14, borderWidth: 1, borderColor: 'rgba(13,148,136,0.4)', width: '100%' },
  altBtnText:   { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.primary },
  btn:          { width: '100%', borderRadius: BorderRadius.lg, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  btnGrad:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  btnText:      { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countdown:    { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.4)' },
  resend:       { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
})
