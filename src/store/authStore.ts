import { create } from 'zustand'
import type { Usuario } from '../types'

interface AuthState {
  token: string | null
  usuario: Usuario | null
  tenantId: string | null
  sucursalId: string | null
  setAuth: (token: string, usuario: Usuario) => void
  setToken: (token: string) => void
  setTenantId: (id: string) => void
  setSucursalId: (id: string) => void
  clearAuth: () => void
  restaurarSesion: (usuario: Usuario, tenantId: string, sucursalId: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  usuario: null,
  tenantId: null,
  sucursalId: null,
  setAuth: (token, usuario) => set({ token, usuario }),
  setToken: (token) => set({ token }),
  setTenantId: (id) => set({ tenantId: id }),
  setSucursalId: (id) => set({ sucursalId: id }),
  restaurarSesion: (usuario, tenantId, sucursalId) => set({ usuario, tenantId, sucursalId }),
  clearAuth: () => set({ token: null, usuario: null, tenantId: null, sucursalId: null }),
}))
