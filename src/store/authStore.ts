import { create } from 'zustand'
import type { Usuario } from '../types'

interface AuthState {
  token: string | null
  usuario: Usuario | null
  tenantId: string | null
  setAuth: (token: string, usuario: Usuario) => void
  setTenantId: (id: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  usuario: null,
  tenantId: localStorage.getItem('tenant_id'),
  setAuth: (token, usuario) => {
    localStorage.setItem('access_token', token)
    set({ token, usuario })
  },
  setTenantId: (id) => {
    localStorage.setItem('tenant_id', id)
    set({ tenantId: id })
  },
  clearAuth: () => {
    localStorage.clear()
    set({ token: null, usuario: null, tenantId: null })
  },
}))
