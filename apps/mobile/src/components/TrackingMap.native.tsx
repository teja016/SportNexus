import React, { useRef, useEffect } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import MapView, { PROVIDER_GOOGLE, Polyline, Marker, Camera } from 'react-native-maps'

interface Props {
  driverLat: number
  driverLng: number
  pickupLat: number
  pickupLng: number
  destLat:   number
  destLng:   number
  status:    string
  onDriverPress?: () => void
}

// Clean Uber-style map — muted roads, no POI clutter
const MAP_STYLE = [
  { featureType: 'poi',              elementType: 'all',      stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',          elementType: 'all',      stylers: [{ visibility: 'off' }] },
  { featureType: 'road',             elementType: 'labels',   stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative',   elementType: 'labels',   stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape',        elementType: 'geometry', stylers: [{ color: '#f5f7fa' }] },
  { featureType: 'water',            elementType: 'geometry', stylers: [{ color: '#c8d8e8' }] },
  { featureType: 'road.highway',     elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial',    elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.local',       elementType: 'geometry', stylers: [{ color: '#f0f0f0' }] },
]

export default function TrackingMap({
  driverLat, driverLng, pickupLat, pickupLng,
  destLat, destLng, status, onDriverPress,
}: Props) {
  const mapRef   = useRef<MapView>(null)
  const markerRef = useRef<any>(null)
  const prevLat  = useRef(driverLat)
  const prevLng  = useRef(driverLng)

  const isPickedUp = ['PICKED_UP', 'AT_ACADEMY', 'COMPLETED'].includes(status)

  // Smoothly animate driver marker to new position
  useEffect(() => {
    if (driverLat === prevLat.current && driverLng === prevLng.current) return
    prevLat.current = driverLat
    prevLng.current = driverLng

    if (markerRef.current?.animateMarkerToCoordinate) {
      markerRef.current.animateMarkerToCoordinate(
        { latitude: driverLat, longitude: driverLng },
        900
      )
    }

    // Keep camera loosely following driver
    mapRef.current?.animateCamera(
      { center: { latitude: driverLat, longitude: driverLng }, zoom: 15 },
      { duration: 900 }
    )
  }, [driverLat, driverLng])

  // Initial camera fit — show driver + destination
  useEffect(() => {
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        isPickedUp
          ? [{ latitude: driverLat, longitude: driverLng }, { latitude: destLat, longitude: destLng }]
          : [
              { latitude: driverLat, longitude: driverLng },
              { latitude: pickupLat, longitude: pickupLng },
              { latitude: destLat,   longitude: destLng },
            ],
        { edgePadding: { top: 80, right: 60, bottom: 320, left: 60 }, animated: true }
      )
    }, 600)
  }, [])

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude:      (driverLat + destLat) / 2,
          longitude:     (driverLng + destLng) / 2,
          latitudeDelta:  Math.abs(driverLat - destLat) * 2.5 + 0.02,
          longitudeDelta: Math.abs(driverLng - destLng) * 2.5 + 0.02,
        }}
      >
        {/* ── Route polyline ───────────────────────────────── */}
        <Polyline
          coordinates={
            isPickedUp
              ? [{ latitude: driverLat, longitude: driverLng }, { latitude: destLat, longitude: destLng }]
              : [
                  { latitude: driverLat, longitude: driverLng },
                  { latitude: pickupLat, longitude: pickupLng },
                  { latitude: destLat,   longitude: destLng },
                ]
          }
          strokeColor="#0D9488"
          strokeWidth={4}
          lineDashPattern={undefined}
        />

        {/* ── Driver marker (smooth animated) ──────────────── */}
        <Marker
          ref={markerRef}
          coordinate={{ latitude: driverLat, longitude: driverLng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          onPress={onDriverPress}
        >
          <View style={styles.driverMarker}>
            <Text style={styles.driverMarkerIcon}>🚗</Text>
          </View>
        </Marker>

        {/* ── Pickup marker ────────────────────────────────── */}
        {!isPickedUp && (
          <Marker
            coordinate={{ latitude: pickupLat, longitude: pickupLng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.pickupMarker}>
              <View style={styles.pickupDot} />
              <View style={styles.pickupStem} />
            </View>
          </Marker>
        )}

        {/* ── Academy marker ───────────────────────────────── */}
        <Marker
          coordinate={{ latitude: destLat, longitude: destLng }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
        >
          <View style={styles.academyMarker}>
            <Text style={styles.academyMarkerIcon}>🏫</Text>
            <View style={styles.academyMarkerStem} />
          </View>
        </Marker>
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1 },

  driverMarker: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#0D9488',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 10,
    borderWidth: 2.5, borderColor: '#fff',
  },
  driverMarkerIcon: { fontSize: 22 },

  pickupMarker: { alignItems: 'center' },
  pickupDot:    {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#1E3A5F',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 8,
  },
  pickupStem: { width: 2.5, height: 8, backgroundColor: '#1E3A5F' },

  academyMarker: { alignItems: 'center' },
  academyMarkerIcon: { fontSize: 26 },
  academyMarkerStem: { width: 2.5, height: 6, backgroundColor: '#475A6E' },
})
