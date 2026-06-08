import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Image, Alert, Platform, Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker } from 'react-native-maps'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { userAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../../constants/theme'

export default function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuthStore()
  const [name, setName]         = useState(user?.name ?? '')
  const [address, setAddress]   = useState(user?.homeAddress ?? '')
  const [dob, setDob]           = useState<Date | null>(
    user?.dob ? new Date(user.dob as string) : null
  )
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  // DOB picker state
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDate, setTempDate] = useState<Date>(dob ?? new Date(2000, 0, 1))

  // Map picker state
  const [showMapModal, setShowMapModal] = useState(false)
  const [mapRegion, setMapRegion] = useState({
    latitude: user?.homeLat ?? 17.4337,
    longitude: user?.homeLng ?? 78.4074,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })
  const [pinLat, setPinLat] = useState(user?.homeLat ?? 17.4337)
  const [pinLng, setPinLng] = useState(user?.homeLng ?? 78.4074)

  const displayPhoto = localPhotoUri ?? user?.profilePhoto ?? null
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  async function pickPhoto() {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Photo upload not available on web.')
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to change your profile picture.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
    })
    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri)
      setUser({ ...user!, profilePhoto: result.assets[0].uri })
    }
  }

  function formatDobDisplay(date: Date | null): string {
    if (!date) return ''
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      if (geo) {
        const parts = [geo.name, geo.district, geo.city].filter(Boolean)
        return parts.join(', ')
      }
    } catch {}
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  async function confirmMapPin() {
    const resolved = await reverseGeocode(pinLat, pinLng)
    setAddress(resolved)
    setShowMapModal(false)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return }
    setError('')
    setLoading(true)
    setSuccess(false)
    try {
      const payload: any = {
        name: name.trim(),
        homeAddress: address.trim() || undefined,
        dob: dob ? dob.toISOString() : undefined,
      }
      // Skip profilePhoto in API — store local URI only
      const updated = await userAPI.updateProfile(payload)
      setUser({ ...updated, profilePhoto: localPhotoUri ?? user?.profilePhoto ?? null })
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
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Avatar section */}
        <LinearGradient colors={['#1AAFC9', '#1C2E4A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.85}>
            {displayPhoto ? (
              <Image source={{ uri: displayPhoto }} style={styles.avatarImg} />
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

            {/* DOB with calendar picker */}
            <View style={[styles.field, styles.fieldBorder]}>
              <View style={styles.fieldHeader}>
                <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                <Text style={styles.fieldLabel}>Date of Birth</Text>
              </View>
              <TouchableOpacity
                style={styles.datePickerRow}
                onPress={() => { setTempDate(dob ?? new Date(2000, 0, 1)); setShowDatePicker(true) }}
                activeOpacity={0.8}
              >
                <Text style={dob ? styles.datePickerValue : styles.datePickerPlaceholder}>
                  {dob ? formatDobDisplay(dob) : 'Select date of birth'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Home Address with map pin */}
            <View style={[styles.field, styles.fieldBorder]}>
              <View style={styles.fieldHeader}>
                <Ionicons name="location-outline" size={14} color={Colors.primary} />
                <Text style={styles.fieldLabel}>Home Address</Text>
              </View>
              <TextInput
                style={styles.fieldInput}
                value={address}
                onChangeText={setAddress}
                placeholder="e.g. Banjara Hills, Hyderabad"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
              <TouchableOpacity style={styles.mapPinBtn} onPress={() => setShowMapModal(true)} activeOpacity={0.85}>
                <Ionicons name="map-outline" size={14} color={Colors.primary} />
                <Text style={styles.mapPinBtnText}>Pin on Map</Text>
              </TouchableOpacity>
            </View>

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

      {/* ── DOB Date Picker ── */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_ev: any, selected?: Date) => {
            setShowDatePicker(false)
            if (selected) setDob(selected)
          }}
        />
      )}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.iosPickerOverlay}>
            <View style={styles.iosPickerCard}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosPickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosPickerTitle}>Date of Birth</Text>
                <TouchableOpacity onPress={() => { setDob(tempDate); setShowDatePicker(false) }}>
                  <Text style={styles.iosPickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_ev: any, selected?: Date) => { if (selected) setTempDate(selected) }}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* ── Map Pin Modal ── */}
      <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
        <View style={styles.mapModal}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>Pin Your Location</Text>
            <TouchableOpacity style={styles.mapConfirmBtn} onPress={confirmMapPin}>
              <Text style={styles.mapConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.mapHint}>Drag the map or tap to reposition the pin</Text>
          <MapView
            style={{ flex: 1 }}
            initialRegion={mapRegion}
            onRegionChangeComplete={(r) => {
              setPinLat(r.latitude)
              setPinLng(r.longitude)
            }}
          >
            <Marker coordinate={{ latitude: pinLat, longitude: pinLng }} draggable
              onDragEnd={(e) => {
                setPinLat(e.nativeEvent.coordinate.latitude)
                setPinLng(e.nativeEvent.coordinate.longitude)
              }}
            />
          </MapView>
        </View>
      </Modal>
    </>
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

  // DOB picker
  datePickerRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  datePickerValue:      { fontSize: FontSize.base, color: Colors.textPrimary },
  datePickerPlaceholder:{ fontSize: FontSize.base, color: Colors.textMuted },

  // Map pin button
  mapPinBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.tealXLight },
  mapPinBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md, padding: 12, marginBottom: 12 },
  errorText:   { fontSize: FontSize.sm, color: Colors.danger, flex: 1 },
  successBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderRadius: BorderRadius.md, padding: 12, marginBottom: 12 },
  successText: { fontSize: FontSize.sm, color: '#059669', fontWeight: FontWeight.semibold },

  saveBtn:     { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: BorderRadius.md, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },

  // iOS date picker modal
  iosPickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  iosPickerCard:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  iosPickerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  iosPickerTitle:   { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  iosPickerCancel:  { fontSize: FontSize.base, color: Colors.textSecondary },
  iosPickerDone:    { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.bold },

  // Map modal
  mapModal:        { flex: 1 },
  mapHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, paddingTop: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  mapHeaderTitle:  { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  mapConfirmBtn:   { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  mapConfirmText:  { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  mapHint:         { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8, backgroundColor: Colors.tealXLight },
})
