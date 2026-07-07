import api from '../../api/client'
import type { LoginRequest, LoginPinRequest, LoginResponse } from '../../types'

export interface Empresa {
  id: string
  nombre: string
  logo_url: string | null
}

export interface PinUser {
  id: string
  nombre: string
  apellido: string | null
  rol: string
}

export const getEmpresas = () =>
  api.get<{ ok: boolean; data: { tenants: Empresa[] } }>('/empresas').then(r => r.data.data.tenants)

export const login = (data: LoginRequest) =>
  api.post<{ data: LoginResponse }>('/auth/login', data).then(r => r.data.data)

export const getPinUsers = (tenantId: string) =>
  api.get<{ ok: boolean; data: { usuarios: PinUser[] } }>('/usuarios/pin-list', { headers: { 'X-Tenant-Id': tenantId } })
    .then(r => r.data.data.usuarios)

export const loginPin = (data: LoginPinRequest, tenantId: string) =>
  api.post<{ data: LoginResponse }>('/auth/login-pin', data, { headers: { 'X-Tenant-Id': tenantId } })
    .then(r => r.data.data)

export const logout = () =>
  api.post('/auth/logout', {}, { withCredentials: true })
