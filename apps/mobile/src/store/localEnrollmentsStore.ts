import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { Enrollment } from '@sportnexus/types'

interface LocalEnrollmentsState {
  enrollments: Enrollment[]
  addEnrollment: (e: Enrollment) => void
  clear: () => void
}

export const useLocalEnrollmentsStore = create<LocalEnrollmentsState>()(
  persist(
    (set, get) => ({
      enrollments: [],
      addEnrollment: (e) => set({ enrollments: [e, ...get().enrollments] }),
      clear: () => set({ enrollments: [] }),
    }),
    {
      name: 'sportnexus-local-enrollments',
      storage: createJSONStorage(() => Platform.OS === 'web' ? localStorage : AsyncStorage),
    }
  )
)
