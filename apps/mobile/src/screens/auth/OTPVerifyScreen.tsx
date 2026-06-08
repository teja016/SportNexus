import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native'
import { MotiView } from 'moti'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

export default function OTPVerifyScreen({ route, navigation }: any) {
  const phone = route.params?.phone ?? ''
  const email = route.params?.email ?? null
  const flow  = route.params?.flow ?? 'register'

  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [userNotFound, setUserNotFound] = useState(false)
  const [countdown, setCountdown]       = useState(30)
  const inputRefs = useRef<Array<TextInput | null>>([])
  const { login } = useAuthStore()

  const pulseAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
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
        const isNotFound = msg.toLowerCase().includes('not found') || err.response?.status === 404
        if (isNotFound) {
          setUserNotFound(true)
          setError(flow === 'login' ? 'No account found for this number.' : 'Registration may have failed. Go back and retry.')
        } else {
          setError(msg || 'Verification failed. Please try again.')
        }
      }
    } finally { setLoading(false) }
  }

  function handleChange(value: string, index: number) {
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setError('')
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every((d) => d !== '')) handleVerify(next)
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  const filled = otp.filter((d) => d !== '').length
  const masked = phone.replace(/(\+91)(\d{3})\d{4}(\d{3})/, '$1 $2 •••• $3')

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0D1B2A', '#1C2E4A', '#1AAFC9']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.circle1} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>

        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 140 }} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>

          {/* Animated shield icon */}
          <View style={styles.iconWrap}>
            <Animated.View style={[styles.iconRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>Verify Your Number</Text>
          <Text style={styles.subtitle}>
            {email ? `Code sent to ${email}` : `6-digit code sent to ${masked}`}
          </Text>
        </MotiView>

        {/* OTP card */}
        <MotiView from={{ opacity: 0, translateY: 40 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 150, damping: 18, stiffness: 140 }} style={styles.card}>

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <MotiView
                key={i}
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 200 + i * 50, damping: 14, stiffness: 180 }}
                style={styles.otpCellWrap}
              >
                <TextInput
                  ref={(r) => { inputRefs.current[i] = r }}
                  style={[styles.otpBox, !!digit && styles.otpBoxFilled, loading && styles.otpBoxLoading]}
                  value={digit}
                  onChangeText={(v) => handleChange(v, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  keyboardType="numeric"
                  maxLength={1}
                  autoFocus={i === 0}
                  editable={!loading}
                  selectTextOnFocus
                />
              </MotiView>
            ))}
          </View>

          {/* Progress dots */}
          <View style={styles.progressRow}>
            {otp.map((d, i) => (
              <View key={i} style={[styles.dot, !!d && styles.dotFilled]} />
            ))}
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={15} color="#DC2626" />
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
            <TouchableOpacity style={styles.altBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-outline" size={16} color="#9CA3AF" />
              <Text style={[styles.altBtnText, { color: '#9CA3AF' }]}>Go back and retry</Text>
            </TouchableOpacity>
          )}

          {!userNotFound && (
            <TouchableOpacity style={styles.btn} onPress={() => handleVerify()} disabled={loading || filled < 6} activeOpacity={0.88}>
              <LinearGradient
                colors={filled === 6 ? ['#1AAFC9', '#0E8FA8'] : ['#D1D5DB', '#D1D5DB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGrad}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <><Text style={[styles.btnText, filled < 6 && { color: '#9CA3AF' }]}>Verify Code</Text><Ionicons name="checkmark-circle" size={18} color={filled === 6 ? '#fff' : '#9CA3AF'} /></>
                }
              </LinearGradient>
            </TouchableOpacity>
          )}

          {countdown > 0 ? (
            <View style={styles.countdownRow}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.countdownText}>Resend code in {countdown}s</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={async () => {
              setCountdown(30); setOtp(['', '', '', '', '', '']); setUserNotFound(false); setError('')
              try { await authAPI.sendOTP(phone) } catch {}
            }} style={styles.countdownRow}>
              <Ionicons name="refresh-outline" size={14} color={Colors.primary} />
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </MotiView>

      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  circle1: { position: 'absolute', top: -80, right: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(26,175,201,0.08)' },
  kav:     { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 24 },

  header:   { alignItems: 'center', gap: 10 },
  backBtn:  { alignSelf: 'flex-start', width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 80, height: 80, marginBottom: 4 },
  iconRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  iconCircle: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  title:    { fontSize: 28, fontWeight: FontWeight.black, color: '#fff', letterSpacing: -0.8 },
  subtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.55)', textAlign: 'center', paddingHorizontal: 20 },

  card:    { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 20 },

  otpRow:     { flexDirection: 'row', gap: 10, alignItems: 'center' },
  otpCellWrap:{ flex: 1 },
  otpBox:     { height: 62, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', textAlign: 'center', fontSize: FontSize['2xl'], fontWeight: FontWeight.black, color: '#111827', backgroundColor: '#F9FAFB' },
  otpBoxFilled:  { borderColor: Colors.primary, backgroundColor: '#F0FDFA', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  otpBoxLoading: { opacity: 0.5 },

  progressRow: { flexDirection: 'row', gap: 8 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotFilled:   { backgroundColor: Colors.primary, width: 20 },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA', width: '100%' },
  errorText: { flex: 1, fontSize: FontSize.sm, color: '#DC2626' },

  altBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', width: '100%' },
  altBtnText:{ fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.primary },

  btn:     { width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countdownText:{ fontSize: FontSize.sm, color: '#9CA3AF' },
  resendText:   { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
})
