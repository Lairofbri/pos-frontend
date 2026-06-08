import { create } from 'zustand'

interface ZoneState {
  zona: string
  setZona: (zona: string) => void
}

export const useZoneStore = create<ZoneState>((set) => ({
  zona: localStorage.getItem('zona') || 'salon',
  setZona: (zona) => {
    localStorage.setItem('zona', zona)
    set({ zona })
  },
}))
