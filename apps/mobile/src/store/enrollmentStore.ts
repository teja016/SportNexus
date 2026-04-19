import { create } from 'zustand'
import { Academy, SportProgram, Slot } from '@sportnexus/types'

interface EnrollmentState {
  selectedAcademy: Academy | null
  selectedProgram: SportProgram | null
  selectedSlots: Slot[]
  durationMonths: number
  transportOpted: boolean
  pickupAddress: string | null
  pickupLat: number | null
  pickupLng: number | null
  pickupDistance: number

  setAcademy: (academy: Academy) => void
  setProgram: (program: SportProgram) => void
  setSlots: (slots: Slot[]) => void
  setDuration: (months: number) => void
  setTransport: (opted: boolean, address?: string, lat?: number, lng?: number, distance?: number) => void
  reset: () => void
}

const initialState = {
  selectedAcademy: null,
  selectedProgram: null,
  selectedSlots: [],
  durationMonths: 1,
  transportOpted: false,
  pickupAddress: null,
  pickupLat: null,
  pickupLng: null,
  pickupDistance: 0,
}

export const useEnrollmentStore = create<EnrollmentState>()((set) => ({
  ...initialState,

  setAcademy: (academy) => set({ selectedAcademy: academy }),
  setProgram: (program) => set({ selectedProgram: program }),
  setSlots: (slots) => set({ selectedSlots: slots }),
  setDuration: (months) => set({ durationMonths: months }),

  setTransport: (opted, address, lat, lng, distance) =>
    set({
      transportOpted: opted,
      pickupAddress: address ?? null,
      pickupLat: lat ?? null,
      pickupLng: lng ?? null,
      pickupDistance: distance ?? 0,
    }),

  reset: () => set(initialState),
}))
