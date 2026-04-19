import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { User } from '@sportnexus/types'
import { useLocalEnrollmentsStore } from './localEnrollmentsStore'
import { useFavoritesStore } from './favoritesStore'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isOnboarded: boolean
  locationSetup: boolean
  userLat: number | null
  userLng: number | null
  homeAddress: string | null

  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  clearDevToken: () => void
  setOnboarded: () => void
  setLocation: (lat: number, lng: number, address: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isOnboarded: false,
      locationSetup: false,
      userLat: null,
      userLng: null,
      homeAddress: null,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: () => {
        useLocalEnrollmentsStore.getState().clear()
        useFavoritesStore.getState().clear()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          locationSetup: false,
        })
      },

      clearDevToken: () =>
        set((state) =>
          state.accessToken?.startsWith('dev-')
            ? { ...state, user: null, accessToken: null, refreshToken: null, isAuthenticated: false }
            : state
        ),

      setOnboarded: () => set({ isOnboarded: true }),

      setLocation: (lat, lng, address) =>
        set({ userLat: lat, userLng: lng, homeAddress: address, locationSetup: true }),
    }),
    {
      name: 'sportnexus-auth',
      storage: createJSONStorage(() => Platform.OS === 'web' ? localStorage : AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
        locationSetup: state.locationSetup,
        userLat: state.userLat,
        userLng: state.userLng,
        homeAddress: state.homeAddress,
      }),
    }
  )
)
