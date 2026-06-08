import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native'
import { MotiView } from 'moti'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../../services/api'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleLogin() {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) { setError('Enter a valid 10-digit phone number.'); return }
    setError('')
    setLoading(true)
    const fullPhone = `+91${cleaned.slice(-10)}`
    try {
      const res = await authAPI.login({ phone: fullPhone })
      navigation.navigate('OTPVerify', { phone: fullPhone, email: res?.email ?? null, flow: 'login' })
    } catch (err: any) {
      if (!err.response) {
        navigation.navigate('OTPVerify', { phone: fullPhone, flow: 'login' })
      } else {
        const msg = err.response?.data?.error?.message ?? ''
        if (msg.toLowerCase().includes('not found') || err.response?.status === 404) {
          setError('No account found with this number.')
        } else {
          setError(msg || 'Login failed. Please try again.')
        }
      }
    } finally { setLoading(false) }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0D1B2A', '#1C2E4A', '#1AAFC9']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>

        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 140 }} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandName}>SportNexus</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in with your phone number</Text>
        </MotiView>

        {/* Form card */}
        <MotiView from={{ opacity: 0, translateY: 40 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 150, damping: 18, stiffness: 140 }} style={styles.card}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="98765 43210"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={(t) => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setError('') }}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={15} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {error.includes('No account') && (
            <TouchableOpacity style={styles.altAction} onPress={() => navigation.replace('Register')}>
              <Text style={styles.altActionText}>Create a new account instead →</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
            <LinearGradient colors={['#1AAFC9', '#0E8FA8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <><Text style={styles.btnText}>Send OTP</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchRow} onPress={() => navigation.replace('Register')}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <Text style={styles.switchLink}>Sign Up</Text>
          </TouchableOpacity>
        </MotiView>

      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  circle1:  { position: 'absolute', top: -80, right: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(26,175,201,0.08)' },
  circle2:  { position: 'absolute', bottom: 100, left: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.03)' },
  kav:      { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 24 },

  header:   { gap: 8 },
  backBtn:  { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  brandName:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' },
  title:    { fontSize: 32, fontWeight: FontWeight.black, color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.55)' },

  card:     { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 20 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 },

  phoneRow:   { flexDirection: 'row', gap: 10 },
  prefix:     { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, justifyContent: 'center' },
  prefixText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#374151' },
  phoneInput: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: '#111827' },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { flex: 1, fontSize: FontSize.sm, color: '#DC2626' },

  altAction:     { alignSelf: 'flex-start' },
  altActionText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  btn:     { borderRadius: 16, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  switchRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: 4 },
  switchText:{ fontSize: FontSize.base, color: '#6B7280' },
  switchLink:{ fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
})
