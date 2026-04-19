import React from 'react'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'

interface Props {
  driverLat: number
  driverLng: number
  pickupLat: number
  pickupLng: number
  destLat: number
  destLng: number
  status: string
}

export default function TrackingMap({ driverLat, driverLng, pickupLat, pickupLng, destLat, destLng }: Props) {
  const midLat = (Math.min(driverLat, destLat) + Math.max(driverLat, destLat)) / 2
  const midLng = (Math.min(driverLng, destLng) + Math.max(driverLng, destLng)) / 2
  const latDelta = Math.abs(driverLat - destLat) + 0.02
  const lngDelta = Math.abs(driverLng - destLng) + 0.02

  return (
    <MapView
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
      region={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
    >
      <Marker coordinate={{ latitude: driverLat, longitude: driverLng }} title="Driver">
      </Marker>
      <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} title="Your Pickup" pinColor="#0D9488" />
      <Marker coordinate={{ latitude: destLat, longitude: destLng }} title="Academy" pinColor="#1E3A5F" />
      <Polyline
        coordinates={[
          { latitude: driverLat, longitude: driverLng },
          { latitude: pickupLat, longitude: pickupLng },
          { latitude: destLat, longitude: destLng },
        ]}
        strokeColor="#0D9488"
        strokeWidth={4}
        lineDashPattern={[8, 4]}
      />
    </MapView>
  )
}
