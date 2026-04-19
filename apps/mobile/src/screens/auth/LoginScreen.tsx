import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../../services/api'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  async function handleLogin() {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }
    setError('')
    setLoading(true)
    const fullPhone = `+91${cleaned.slice(-10)}`
    try {
      const res = await authAPI.login({ phone: fullPhone })
      navigation.navigate('OTPVerify', { phone: fullPhone, email: res?.email ?? null, flow: 'login' })
    } catch (err: any) {
      const isNetworkError = !err.response
      if (isNetworkError) {
        navigation.navigate('OTPVerify', { phone: fullPhone, flow: 'login' })
      } else {
        const msg = err.response?.data?.error?.message ?? ''
        if (msg.toLowerCase().includes('not found') || err.response?.status === 404) {
          setError('No account found with this number.')
        } else {
          setError(msg || 'Login failed. Please try again.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.iconWrap}>
        <Ionicons name="log-in-outline" size={36} color={Colors.primary} />
      </View>

      <Text style={styles.heading}>Welcome Back</Text>
      <Text style={styles.sub}>Enter your registered phone number to receive a verification code</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="9876543210"
            placeholderTextColor={Colors.textMuted}
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus
          />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* No account? suggestion */}
        {error.includes('No account') && (
          <TouchableOpacity style={styles.createAccountBtn} onPress={() => navigation.replace('Register')}>
            <Ionicons name="person-add-outline" size={16} color={Colors.primary} />
            <Text style={styles.createAccountText}>Create a new account instead</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={styles.btnInner}>
                <Text style={styles.btnText}>Send OTP</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.replace('Register')}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <Text style={styles.switchLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 60 },

  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, marginBottom: 32,
    ...Shadow.xs,
  },

  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.tealXLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    ...Shadow.sm,
  },

  heading: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
  sub:     { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 8, marginBottom: 36, lineHeight: 22 },

  form:    { gap: 16 },
  label:   { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: -8 },

  phoneRow:  { flexDirection: 'row', gap: 8 },
  prefix:    {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, justifyContent: 'center',
  },
  prefixText:{ fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  phoneInput:{
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary,
  },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { flex: 1, fontSize: FontSize.sm, color: Colors.danger },

  createAccountBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.tealXLight, borderRadius: BorderRadius.md,
    padding: 12, borderWidth: 1, borderColor: Colors.tealLight,
  },
  createAccountText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },

  btn: {
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: BorderRadius.lg,
    alignItems: 'center', marginTop: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText:  { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  switchBtn:  { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  switchText: { fontSize: FontSize.base, color: Colors.textSecondary },
  switchLink: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
})
