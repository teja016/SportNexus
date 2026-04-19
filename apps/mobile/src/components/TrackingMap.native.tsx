import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, BorderRadius, Shadow } from '../constants/theme'

interface Props {
  driverLat: number
  driverLng: number
  pickupLat: number
  pickupLng: number
  destLat: number
  destLng: number
  status: string
  onDriverPress?: () => void
}

// Pure RN route visualization — no Google Maps API key required
export default function TrackingMap({ driverLat, driverLng, pickupLat, pickupLng, destLat, destLng, status, onDriverPress }: Props) {
  const isMoving   = ['ARRIVING', 'PICKED_UP'].includes(status)
  const isPickedUp = status === 'PICKED_UP' || status === 'AT_ACADEMY' || status === 'COMPLETED'

  return (
    <View style={styles.container}>
      {/* Background grid */}
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, { top: `${(i + 1) * 14}%` as any }]} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 18}%` as any }]} />
        ))}
      </View>

      {/* Route line */}
      <View style={styles.routeLine} />

      {/* Driver marker */}
      <View style={[styles.markerWrap, isPickedUp ? styles.markerMid : styles.markerLeft, { zIndex: 10 }]}>
        <View
          style={[styles.driverMarker, isMoving && styles.driverMarkerActive]}
          onTouchEnd={onDriverPress}
        >
          <Text style={{ fontSize: 22 }}>🚗</Text>
        </View>
        <View style={styles.markerPulse} />
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText}>Driver</Text>
        </View>
      </View>

      {/* Pickup marker */}
      {!isPickedUp && (
        <View style={[styles.markerWrap, styles.markerMid]}>
          <View style={[styles.pinMarker, { backgroundColor: Colors.primary }]}>
            <Ionicons name="person" size={14} color="#fff" />
          </View>
          <View style={styles.markerLabel}>
            <Text style={styles.markerLabelText}>Pickup</Text>
          </View>
        </View>
      )}

      {/* Academy marker */}
      <View style={[styles.markerWrap, styles.markerRight]}>
        <View style={[styles.pinMarker, { backgroundColor: Colors.navy }]}>
          <Ionicons name="school" size={14} color="#fff" />
        </View>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText}>Academy</Text>
        </View>
      </View>

      {/* Status overlay */}
      <View style={styles.statusOverlay}>
        <Ionicons
          name={isMoving ? 'navigate' : 'time-outline'}
          size={14}
          color={isMoving ? Colors.accent : Colors.textSecondary}
        />
        <Text style={[styles.statusText, isMoving && { color: Colors.accent }]}>
          {status === 'DISPATCHED' ? 'Driver assigned' :
           status === 'ARRIVING'   ? 'Driver on the way' :
           status === 'PICKED_UP'  ? 'En route to academy' :
           status === 'AT_ACADEMY' ? 'Arrived at academy' :
           status === 'COMPLETED'  ? 'Session complete' : 'Scheduled'}
        </Text>
      </View>

      {/* Coordinate chips */}
      <View style={styles.coordRow}>
        <View style={styles.coordChip}>
          <Text style={styles.coordLabel}>Driver</Text>
          <Text style={styles.coordVal}>{driverLat.toFixed(4)}, {driverLng.toFixed(4)}</Text>
        </View>
        <View style={styles.coordChip}>
          <Text style={styles.coordLabel}>You</Text>
          <Text style={styles.coordVal}>{pickupLat.toFixed(4)}, {pickupLng.toFixed(4)}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#E8F4F8', overflow: 'hidden', position: 'relative' },
  grid:            { ...StyleSheet.absoluteFillObject },
  gridLine:        { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  gridLineV:       { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.4)' },

  routeLine:       { position: 'absolute', top: '45%', left: '12%', right: '12%', height: 3, backgroundColor: Colors.primary, borderRadius: 2, opacity: 0.7 },

  markerWrap:      { position: 'absolute', top: '30%', alignItems: 'center' },
  markerLeft:      { left: '10%' },
  markerMid:       { left: '45%' },
  markerRight:     { right: '10%' },

  driverMarker:    { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadow.md, borderWidth: 2, borderColor: Colors.primary },
  driverMarkerActive: { borderColor: Colors.accent, shadowColor: Colors.accent },
  markerPulse:     { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: Colors.primary, opacity: 0.3, top: -6, left: -6 },

  pinMarker:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  markerLabel:     { marginTop: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  markerLabelText: { fontSize: 10, color: Colors.textPrimary, fontWeight: '600' },

  statusOverlay:   { position: 'absolute', bottom: 80, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, ...Shadow.sm },
  statusText:      { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  coordRow:        { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', gap: 8 },
  coordChip:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 10, padding: 8 },
  coordLabel:      { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  coordVal:        { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
})
