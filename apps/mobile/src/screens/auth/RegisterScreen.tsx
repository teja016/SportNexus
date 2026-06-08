import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native'
import { MotiView } from 'moti'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { authAPI } from '../../services/api'
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme'

function Field({ icon, label, value, onChange, placeholder, keyboardType, autoCapitalize, prefix, maxLength }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.row, focused && fieldStyles.focused]}>
        <Ionicons name={icon} size={17} color={focused ? Colors.primary : '#9CA3AF'} />
        {prefix && <Text style={fieldStyles.prefix}>{prefix}</Text>}
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  wrap:    { gap: 7 },
  label:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  focused: { borderColor: Colors.primary, backgroundColor: '#fff' },
  prefix:  { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#374151' },
  input:   { flex: 1, fontSize: FontSize.base, color: '#111827' },
})

export default function RegisterScreen({ navigation }: any) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleRegister() {
    if (!name.trim() || !email.trim() || phone.length < 10) {
      setError('Please fill in all fields correctly.')
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
    } finally { setLoading(false) }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0D1B2A', '#1C2E4A', '#1AAFC9']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 140 }} style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandName}>SportNexus</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of athletes today</Text>
          </MotiView>

          {/* Form card */}
          <MotiView from={{ opacity: 0, translateY: 40 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', delay: 150, damping: 18, stiffness: 140 }} style={styles.card}>
            {[
              { icon: 'person-outline', label: 'Full Name', value: name, onChange: (t: string) => { setName(t); setError('') }, placeholder: 'Rahul Sharma', autoCapitalize: 'words', delay: 0 },
              { icon: 'mail-outline', label: 'Email Address', value: email, onChange: (t: string) => { setEmail(t); setError('') }, placeholder: 'you@example.com', keyboardType: 'email-address', delay: 60 },
              { icon: 'call-outline', label: 'Phone Number', value: phone, onChange: (t: string) => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setError('') }, placeholder: '98765 43210', keyboardType: 'phone-pad', maxLength: 10, prefix: '+91', delay: 120 },
            ].map((f) => (
              <MotiView key={f.label} from={{ opacity: 0, translateX: -16 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'spring', delay: 200 + f.delay, damping: 18, stiffness: 160 }}>
                <Field {...f} />
              </MotiView>
            ))}

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.88}>
              <LinearGradient colors={['#1AAFC9', '#0E8FA8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <><Text style={styles.btnText}>Create Account</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchRow} onPress={() => navigation.replace('Login')}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <Text style={styles.switchLink}>Sign In</Text>
            </TouchableOpacity>
          </MotiView>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  circle1:  { position: 'absolute', top: -80, right: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(26,175,201,0.08)' },
  circle2:  { position: 'absolute', bottom: 100, left: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.03)' },
  scroll:   { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40, gap: 24 },

  header:   { gap: 8 },
  backBtn:  { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  brandName:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' },
  title:    { fontSize: 32, fontWeight: FontWeight.black, color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.55)' },

  card:     { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 20 },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { flex: 1, fontSize: FontSize.sm, color: '#DC2626' },

  btn:     { borderRadius: 16, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10, marginTop: 4 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  switchRow: { flexDirection: 'row', justifyContent: 'center', paddingTop: 4 },
  switchText:{ fontSize: FontSize.base, color: '#6B7280' },
  switchLink:{ fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },
})
