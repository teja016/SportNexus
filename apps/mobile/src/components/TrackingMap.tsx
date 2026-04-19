// TypeScript-visible fallback. Metro resolves to TrackingMap.native.tsx on native
// and TrackingMap.web.tsx on web — this file is never used at runtime.
import React from 'react'
import { View } from 'react-native'

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

export default function TrackingMap(_props: Props) {
  return <View />
}
