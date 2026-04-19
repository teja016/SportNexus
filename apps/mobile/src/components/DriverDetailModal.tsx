import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, BorderRadius, Shadow } from '../constants/theme'

export interface DriverDetails {
  name: string
  phone: string
  vehicleNumber: string
  vehicleModel: string
  vehicleColor: string
  licenseNumber: string
  aadharLast4: string
}

interface Props {
  driver: DriverDetails
  onClose: () => void
}

const DETAIL_ROWS: { icon: string; label: string; key: keyof DriverDetails; format?: (v: string) => string }[] = [
  { icon: 'person-outline',      label: 'Driver Name',     key: 'name' },
  { icon: 'call-outline',        label: 'Phone',            key: 'phone' },
  { icon: 'car-outline',         label: 'Vehicle Number',   key: 'vehicleNumber' },
  { icon: 'speedometer-outline', label: 'Vehicle Model',    key: 'vehicleModel' },
  { icon: 'color-palette-outline',label: 'Vehicle Color',   key: 'vehicleColor' },
  { icon: 'card-outline',        label: 'Driving License',  key: 'licenseNumber' },
  { icon: 'finger-print-outline', label: 'Aadhar (Last 4)', key: 'aadharLast4', format: (v) => `XXXX-XXXX-${v}` },
]

export default function DriverDetailModal({ driver, onClose }: Props) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 36 }}>👨‍✈️</Text>
            </View>
            <View>
              <Text style={styles.heading}>Driver Details</Text>
              <Text style={styles.subHeading}>Verified by SportNexus ✓</Text>
            </View>
          </View>

          {/* Detail Rows */}
          <View style={styles.detailCard}>
            {DETAIL_ROWS.map((row, idx) => (
              <View key={row.key}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name={row.icon as any} size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>
                      {row.format ? row.format(driver[row.key]) : driver[row.key] || '—'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${driver.phone}`)}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.callBtnText}>Call Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyBtn} onPress={() => Linking.openURL('tel:112')}>
              <Ionicons name="warning-outline" size={18} color={Colors.danger} />
              <Text style={styles.emergencyBtnText}>Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 16 },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 4 },
  closeBtn:       { position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: Colors.surface, borderRadius: 20, ...Shadow.sm, zIndex: 10 },
  avatarRow:      { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  avatar:         { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  heading:        { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  subHeading:     { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600', marginTop: 2 },
  detailCard:     { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, ...Shadow.sm },
  detailRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  detailIcon:     { width: 36, height: 36, borderRadius: BorderRadius.sm, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  detailLabel:    { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue:    { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '700', marginTop: 1 },
  divider:        { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  actionsRow:     { flexDirection: 'row', gap: 12 },
  callBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 14 },
  callBtnText:    { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  emergencyBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md, paddingVertical: 14, borderWidth: 1, borderColor: '#FECACA' },
  emergencyBtnText:{ color: Colors.danger, fontSize: FontSize.base, fontWeight: '700' },
})
