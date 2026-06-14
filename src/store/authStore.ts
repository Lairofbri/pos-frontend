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
  setAuth: (token: string, usuario: Usuario) => void
  setTenantId: (id: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  usuario: getStoredUsuario(),
  tenantId: localStorage.getItem(STORAGE_KEYS.TENANT_ID),
  setAuth: (token, usuario) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USUARIO_DATA, JSON.stringify(usuario))
    set({ token, usuario })
  },
  setTenantId: (id) => {
    localStorage.setItem(STORAGE_KEYS.TENANT_ID, id)
    set({ tenantId: id })
  },
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USUARIO_DATA)
    localStorage.removeItem(STORAGE_KEYS.TENANT_ID)
    set({ token: null, usuario: null, tenantId: null })
  },
}))
