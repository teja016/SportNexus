import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

export interface AppNotification {
  id: string
  type: 'ENROLLED' | 'PAYMENT_PENDING' | 'TRANSPORT' | 'STARTING_SOON' | 'GENERAL'
  title: string
  body: string
  enrollmentId?: string
  academyName?: string
  createdAt: string
  read: boolean
}

interface NotificationsState {
  notifications: AppNotification[]
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  removeNotification: (id: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (n) => {
        const existing = get().notifications
        // Dedupe by type + enrollmentId
        const key = `${n.type}-${n.enrollmentId ?? 'none'}`
        if (existing.some((e) => `${e.type}-${e.enrollmentId ?? 'none'}` === key)) return
        set({
          notifications: [
            {
              ...n,
              id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...existing,
          ],
        })
      },
      removeNotification: (id) =>
        set({ notifications: get().notifications.filter((n) => n.id !== id) }),
      markRead: (id) =>
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }),
      markAllRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'sportnexus-notifications',
      storage: createJSONStorage(() => (Platform.OS === 'web' ? localStorage : AsyncStorage)),
    }
  )
)
