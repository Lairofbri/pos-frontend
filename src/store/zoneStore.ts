import { create } from 'zustand'
import { STORAGE_KEYS, DEFAULT_ZONA } from '../config/constants'

interface ZoneState {
  zona: string
  setZona: (zona: string) => void
}

export const useZoneStore = create<ZoneState>((set) => ({
  zona: localStorage.getItem(STORAGE_KEYS.ZONA) || DEFAULT_ZONA,
  setZona: (zona) => {
    localStorage.setItem(STORAGE_KEYS.ZONA, zona)
    set({ zona })
  },
}))
