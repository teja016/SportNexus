import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Alert, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { userAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

export default function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuthStore()
  const [name, setName]       = useState(user?.name ?? '')
  const [address, setAddress] = useState(user?.homeAddress ?? '')
  const [dob, setDob]         = useState(user?.dob ? (user.dob as string).slice(0, 10) : '')
  const [photo, setPhoto]     = useState<string | null>(user?.profilePhoto ?? null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  async function pickPhoto() {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Photo upload not available on web.')
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload a profile picture.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      const base64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
      setPhoto(base64)
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return }
    setError('')
    setLoading(true)
    setSuccess(false)
    try {
      const updated = await userAPI.updateProfile({
        name:        name.trim(),
        homeAddress: address.trim() || undefined,
        dob:         dob || undefined,
        profilePhoto: photo ?? undefined,
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      {/* Avatar section */}
      <LinearGradient colors={['#0D9488', '#1E3A5F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.85}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change photo</Text>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        <View style={styles.card}>
          <Field label="Full Name" value={name} onChange={setName} placeholder="Your full name" autoCapitalize="words" icon="person-outline" />
          <Field label="Date of Birth" value={dob} onChange={setDob} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" icon="calendar-outline" hint="Format: YYYY-MM-DD" />
          <Field label="Home Address" value={address} onChange={setAddress} placeholder="e.g. Banjara Hills, Hyderabad" icon="location-outline" />
          <Field label="Email" value={user?.email ?? ''} onChange={() => {}} placeholder="" editable={false} hint="Cannot be changed" icon="mail-outline" />
          <Field label="Phone" value={user?.phone ?? ''} onChange={() => {}} placeholder="" editable={false} hint="Cannot be changed" icon="call-outline" last />
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
            <Text style={styles.successText}>Profile updated successfully!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.saveBtnText}>Save Changes</Text></>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function Field({ label, value, onChange, placeholder, keyboardType, autoCapitalize, editable = true, hint, last, icon }: any) {
  return (
    <View style={[styles.field, !last && styles.fieldBorder]}>
      <View style={styles.fieldHeader}>
        <Ionicons name={icon} size={14} color={Colors.primary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
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
  container:     { flex: 1, backgroundColor: Colors.background },

  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 28, gap: 8 },
  avatarWrap:    { position: 'relative' },
  avatarImg:     { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarFallback:{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText:    { fontSize: 28, fontWeight: FontWeight.extrabold, color: '#fff' },
  cameraBtn:     { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarHint:    { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },

  card:               { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm, marginBottom: 16 },
  field:              { paddingHorizontal: 16, paddingVertical: 14 },
  fieldBorder:        { borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldHeader:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel:         { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput:         { fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: 0 },
  fieldInputDisabled: { color: Colors.textMuted },
  fieldHint:          { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },

  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md, padding: 12, marginBottom: 12 },
  errorText:   { fontSize: FontSize.sm, color: Colors.danger, flex: 1 },
  successBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderRadius: BorderRadius.md, padding: 12, marginBottom: 12 },
  successText: { fontSize: FontSize.sm, color: '#059669', fontWeight: FontWeight.semibold },

  saveBtn:     { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: BorderRadius.md, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
})
