import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

export default function RegisterScreen({ navigation }: any) {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [phone, setPhone]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister() {
    if (!name.trim() || !email.trim() || phone.length < 10) {
      setError('Please fill all fields correctly.')
      return
    }
    setError('')
    setLoading(true)
    const fullPhone = `+91${phone}`
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.heading}>Create Account</Text>
      <Text style={styles.sub}>Join SportNexus to discover academies near you</Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="Rahul Sharma" value={name} onChangeText={setName} autoCapitalize="words" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefix}><Text style={styles.prefixText}>+91</Text></View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="9876543210"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {!!error && <Text style={{ color: Colors.danger, fontSize: FontSize.sm }}>{error}</Text>}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={styles.btnInner}>
                <Text style={styles.btnText}>Send OTP</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Text style={styles.switchLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 60 },
  backBtn:   { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 32 },
  heading:   { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -0.5 },
  sub:       { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 6, marginBottom: 32 },
  form:      { gap: 20 },
  field:     { gap: 6 },
  label:     { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  input:     { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: FontSize.base, color: Colors.textPrimary },
  phoneRow:  { flexDirection: 'row', gap: 8 },
  prefix:    { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 14, justifyContent: 'center' },
  prefixText:{ fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  phoneInput:{ flex: 1 },
  btn:       { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  btnInner:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText:   { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  switchBtn: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  switchText:{ fontSize: FontSize.base, color: Colors.textSecondary },
  switchLink:{ fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
})
