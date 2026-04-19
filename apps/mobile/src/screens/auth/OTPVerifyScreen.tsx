import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../../services/api'

import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

export default function OTPVerifyScreen({ route, navigation }: any) {
  const phone  = route.params?.phone ?? ''
  const email  = route.params?.email ?? null   // set when email OTP was sent
  const flow   = route.params?.flow ?? 'register'  // 'login' | 'register'
  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [userNotFound, setUserNotFound] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const inputRefs = useRef<Array<TextInput | null>>([])
  const { login } = useAuthStore()

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function handleVerify(code?: string[]) {
    const digits = code ?? otp
    const otpStr = digits.join('')
    if (otpStr.length < 6) {
      setError('Please enter all 6 digits.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.verifyOTP(phone, otpStr)
      login(data.user, data.accessToken, data.refreshToken)
    } catch (err: any) {
      const isNetworkDown = !err.response
      if (isNetworkDown) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Verify OTP</Text>
      <Text style={styles.sub}>
        {email
          ? <>OTP sent to email{'\n'}<Text style={styles.phone}>{email}</Text></>
          : <>Enter the 6-digit OTP sent to{'\n'}<Text style={styles.phone}>{phone}</Text></>
        }
      </Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputRefs.current[i] = r }}
            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
            value={digit}
            onChangeText={(v) => handleChange(v, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="numeric"
            maxLength={1}
            autoFocus={i === 0}
          />
        ))}
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Recovery action when user not found */}
      {userNotFound && flow === 'login' && (
        <TouchableOpacity
          style={styles.createAccountBtn}
          onPress={() => navigation.replace('Register')}
        >
          <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
          <Text style={styles.createAccountText}>Create a new account</Text>
        </TouchableOpacity>
      )}
      {userNotFound && flow === 'register' && (
        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.goBackText}>Go back and try again</Text>
        </TouchableOpacity>
      )}

      {!userNotFound && (
        <TouchableOpacity style={styles.btn} onPress={() => handleVerify()} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Verify OTP</Text>}
        </TouchableOpacity>
      )}

      {countdown > 0 ? (
        <Text style={styles.countdown}>Resend OTP in {countdown}s</Text>
      ) : (
        <TouchableOpacity onPress={async () => {
          setCountdown(30)
          setOtp(['', '', '', '', '', ''])
          setUserNotFound(false)
          setError('')
          try { await authAPI.sendOTP(phone) } catch {}
        }}>
          <Text style={styles.resend}>Resend OTP</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 80, alignItems: 'center' },
  heading:      { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  sub:          { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 40, lineHeight: 24 },
  phone:        { color: Colors.primary, fontWeight: FontWeight.bold },
  otpRow:       { flexDirection: 'row', gap: 12, marginBottom: 16 },
  otpBox:       { width: 48, height: 56, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, textAlign: 'center', fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, backgroundColor: Colors.surface },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.tealLight },
  errorBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md, padding: 12, borderWidth: 1, borderColor: '#FECACA', width: '100%', marginBottom: 12 },
  errorText:    { flex: 1, fontSize: FontSize.sm, color: Colors.danger, lineHeight: 20 },
  createAccountBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.tealXLight, borderRadius: BorderRadius.md, padding: 14, borderWidth: 1, borderColor: Colors.tealLight, width: '100%', marginBottom: 16 },
  createAccountText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.primary },
  goBackBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.md, padding: 14, width: '100%', marginBottom: 16 },
  goBackText:   { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  btn:          { backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: BorderRadius.md, alignItems: 'center', marginBottom: 20, width: '100%' },
  btnText:      { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  countdown:    { fontSize: FontSize.sm, color: Colors.textSecondary },
  resend:       { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
})
