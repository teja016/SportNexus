import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { TransitStatus } from '@sportnexus/types'
import { SOCKET_URL } from '../services/api'

interface TransitLocation {
  lat: number
  lng: number
}

interface UseTransitSocketReturn {
  location: TransitLocation | null
  eta: number | null
  status: TransitStatus
  isConnected: boolean
}

export function useTransitSocket(sessionId: string): UseTransitSocketReturn {
  const socketRef = useRef<Socket | null>(null)
  const [location, setLocation] = useState<TransitLocation | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const [status, setStatus] = useState<TransitStatus>('SCHEDULED')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join-transit', { sessionId })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('location-update', ({ lat, lng, eta: newEta, status: newStatus }: {
      lat: number; lng: number; eta: number; status: TransitStatus
    }) => {
      setLocation({ lat, lng })
      setEta(newEta)
      setStatus(newStatus)
    })

    socket.on('status-update', ({ status: newStatus }: { status: TransitStatus }) => {
      setStatus(newStatus)
    })

    socket.on('session-completed', () => {
      setStatus('COMPLETED')
    })

    return () => {
      socket.emit('leave-transit', { sessionId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionId])

  return { location, eta, status, isConnected }
}
