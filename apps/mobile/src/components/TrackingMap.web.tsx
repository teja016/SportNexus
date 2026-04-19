import React, { useEffect, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Shadow } from '../constants/theme'

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

declare const window: any

export default function TrackingMap({ driverLat, driverLng, pickupLat, pickupLng, destLat, destLng, onDriverPress }: Props) {
  const containerRef = useRef<any>(null)
  const mapRef       = useRef<any>(null)
  const driverMarker = useRef<any>(null)
  const routeLine    = useRef<any>(null)

  useEffect(() => {
    function loadLeaflet(cb: () => void) {
      if (window.L) { cb(); return }
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = cb
      document.head.appendChild(script)
    }

    loadLeaflet(() => {
      if (!containerRef.current || mapRef.current) return
      const L = window.L

      const map = L.map(containerRef.current, { zoomControl: false }).setView([driverLat, driverLng], 14)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Custom zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Driver icon (clickable car)
      const driverIcon = L.divIcon({
        className: '',
        html: `<div style="font-size:30px;cursor:pointer;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));transition:transform 0.3s">🚗</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      // Pickup marker
      const pickupIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#0D9488;border:3px solid white;box-shadow:0 2px 8px rgba(13,148,136,0.5)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      // Academy marker
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="background:#1E3A5F;color:white;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏟️ Academy</div>`,
        iconSize: [100, 30],
        iconAnchor: [50, 30],
      })

      const driver = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map)
      driver.on('click', () => { if (onDriverPress) onDriverPress() })
      driverMarker.current = driver

      L.marker([pickupLat, pickupLng], { icon: pickupIcon }).addTo(map)
        .bindPopup('<b>Your Pickup Location</b>')

      L.marker([destLat, destLng], { icon: destIcon }).addTo(map)
        .bindPopup('<b>Academy</b>')

      // Route polyline
      routeLine.current = L.polyline(
        [[driverLat, driverLng], [pickupLat, pickupLng], [destLat, destLng]],
        { color: '#0D9488', weight: 5, opacity: 0.8, dashArray: '10, 6' }
      ).addTo(map)

      // Fit all points
      map.fitBounds(
        L.latLngBounds([[driverLat, driverLng], [pickupLat, pickupLng], [destLat, destLng]]),
        { padding: [50, 50] }
      )

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        driverMarker.current = null
        routeLine.current = null
      }
    }
  }, [])

  // Move driver marker and update route smoothly
  useEffect(() => {
    if (!driverMarker.current || !driverLat || !driverLng) return
    driverMarker.current.setLatLng([driverLat, driverLng])
    if (routeLine.current) {
      routeLine.current.setLatLngs([
        [driverLat, driverLng],
        [pickupLat, pickupLng],
        [destLat, destLng],
      ])
    }
  }, [driverLat, driverLng])

  function recenter() {
    if (mapRef.current && driverMarker.current) {
      mapRef.current.flyTo([driverLat, driverLng], 15, { animate: true, duration: 0.8 })
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View ref={containerRef} style={{ flex: 1, width: '100%' } as any} />

      {/* Recenter button */}
      <TouchableOpacity style={styles.recenterBtn} onPress={recenter}>
        <Ionicons name="locate" size={22} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  recenterBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
    zIndex: 999,
  },
})
