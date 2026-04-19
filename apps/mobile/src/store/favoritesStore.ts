import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { Academy } from '@sportnexus/types'

interface FavoritesState {
  favorites: Academy[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (academy: Academy) => void
  clear: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (id) => get().favorites.some((a) => a.id === id),
      toggleFavorite: (academy) => {
        const exists = get().favorites.some((a) => a.id === academy.id)
        set({
          favorites: exists
            ? get().favorites.filter((a) => a.id !== academy.id)
            : [academy, ...get().favorites],
        })
      },
      clear: () => set({ favorites: [] }),
    }),
    {
      name: 'sportnexus-favorites',
      storage: createJSONStorage(() => (Platform.OS === 'web' ? localStorage : AsyncStorage)),
    }
  )
)
