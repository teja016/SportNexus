import { useEffect, useRef } from 'react'
import * as Location from 'expo-location'
import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '../services/api'
import { useAuthStore } from '../store/authStore'

export function useDriverLocation(sessionId: string | null, active: boolean) {
  const socketRef = useRef<Socket | null>(null)
  const watchRef  = useRef<Location.LocationSubscription | null>(null)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    if (!sessionId || !active) return

    socketRef.current = io(SOCKET_URL, { auth: { token: accessToken }, transports: ['websocket'] })
    socketRef.current.emit('join-transit', { sessionId })

    let lastEmit = 0

    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 20, timeInterval: 5000 },
        (loc) => {
          const now = Date.now()
          if (now - lastEmit < 4000) return
          lastEmit = now
          socketRef.current?.emit('driver-location', {
            sessionId,
            lat:     loc.coords.latitude,
            lng:     loc.coords.longitude,
            speed:   loc.coords.speed ?? 0,
            heading: loc.coords.heading ?? 0,
          })
        }
      ).then((sub) => { watchRef.current = sub })
    })

    return () => {
      watchRef.current?.remove()
      socketRef.current?.emit('leave-transit', { sessionId })
      socketRef.current?.disconnect()
    }
  }, [sessionId, active])
}
