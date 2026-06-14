import { create } from 'zustand'

export interface ToastMessage {
  type: 'success' | 'error'
  message: string
  description?: string
}

interface ToastState {
  toast: ToastMessage | null
  show: (t: ToastMessage) => void
  hide: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (toast) => set({ toast }),
  hide: () => set({ toast: null }),
}))
