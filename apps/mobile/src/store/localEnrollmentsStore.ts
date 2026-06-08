import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { Enrollment } from '@sportnexus/types'

interface LocalEnrollmentsState {
  enrollments: Enrollment[]
  addEnrollment: (e: Enrollment) => void
  removeEnrollment: (id: string) => void
  updateEnrollment: (id: string, changes: Partial<Enrollment>) => void
  clear: () => void
}

export const useLocalEnrollmentsStore = create<LocalEnrollmentsState>()(
  persist(
    (set, get) => ({
      enrollments: [],
      addEnrollment: (e) => set({ enrollments: [e, ...get().enrollments] }),
      removeEnrollment: (id) => set({ enrollments: get().enrollments.filter((e) => e.id !== id) }),
      updateEnrollment: (id, changes) => set({
        enrollments: get().enrollments.map((e) => e.id === id ? { ...e, ...changes } : e),
      }),
      clear: () => set({ enrollments: [] }),
    }),
    {
      name: 'sportnexus-local-enrollments',
      storage: createJSONStorage(() => Platform.OS === 'web' ? localStorage : AsyncStorage),
    }
  )
)
