import { create } from 'zustand'
import type { Usuario } from '../types'
import { STORAGE_KEYS } from '../config/constants'

function getStoredUsuario(): Usuario | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USUARIO_DATA)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

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
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  usuario: getStoredUsuario(),
  tenantId: localStorage.getItem(STORAGE_KEYS.TENANT_ID),
  sucursalId: localStorage.getItem(STORAGE_KEYS.SUCURSAL_ID),
  setAuth: (token, usuario) => {
    localStorage.setItem(STORAGE_KEYS.USUARIO_DATA, JSON.stringify(usuario))
    set({ token, usuario })
  },
  setToken: (token) => set({ token }),
  setTenantId: (id) => {
    localStorage.setItem(STORAGE_KEYS.TENANT_ID, id)
    set({ tenantId: id })
  },
  setSucursalId: (id) => {
    localStorage.setItem(STORAGE_KEYS.SUCURSAL_ID, id)
    set({ sucursalId: id })
  },
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.USUARIO_DATA)
    localStorage.removeItem(STORAGE_KEYS.TENANT_ID)
    localStorage.removeItem(STORAGE_KEYS.SUCURSAL_ID)
    set({ token: null, usuario: null, tenantId: null, sucursalId: null })
  },
}))
