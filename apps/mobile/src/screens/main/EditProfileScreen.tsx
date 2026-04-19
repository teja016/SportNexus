import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { userAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, BorderRadius, Shadow } from '../../constants/theme'

export default function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuthStore()
  const [name, setName]       = useState(user?.name ?? '')
  const [email, setEmail]     = useState(user?.email ?? '')
  const [address, setAddress] = useState(user?.homeAddress ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  async function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return }
    setError('')
    setLoading(true)
    setSuccess(false)
    try {
      const updated = await userAPI.updateProfile({
        name: name.trim(),
        homeAddress: address.trim() || undefined,
      })
      setUser(updated)
      setSuccess(true)
      setTimeout(() => navigation.goBack(), 1200)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Failed to save. Try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" autoCapitalize="words" />
        <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" editable={false} hint="Email cannot be changed" />
        <Field label="Phone" value={user?.phone ?? ''} onChange={() => {}} placeholder="" editable={false} hint="Phone cannot be changed" />
        <Field label="Home Address" value={address} onChange={setAddress} placeholder="e.g. Banjara Hills, Hyderabad" last />
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {success && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
          <Text style={styles.successText}>Profile updated!</Text>
        </View>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.saveBtnText}>Save Changes</Text></>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

function Field({ label, value, onChange, placeholder, keyboardType, autoCapitalize, editable = true, hint, last }: any) {
  return (
    <View style={[styles.field, !last && styles.fieldBorder]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'none'}
        editable={editable}
      />
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },
  avatarRow:          { alignItems: 'center', marginBottom: 20 },
  avatar:             { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:         { fontSize: 24, fontWeight: '800', color: '#fff' },
  card:               { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm, marginBottom: 16 },
  field:              { paddingHorizontal: 16, paddingVertical: 14 },
  fieldBorder:        { borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel:         { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput:         { fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: 0 },
  fieldInputDisabled: { color: Colors.textMuted },
  fieldHint:          { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  errorBox:           { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md, padding: 12, marginBottom: 12 },
  errorText:          { fontSize: FontSize.sm, color: Colors.danger, flex: 1 },
  successBox:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderRadius: BorderRadius.md, padding: 12, marginBottom: 12 },
  successText:        { fontSize: FontSize.sm, color: '#059669', fontWeight: '600' },
  saveBtn:            { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: BorderRadius.md },
  saveBtnText:        { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
})
