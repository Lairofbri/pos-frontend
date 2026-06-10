import api from '../../api/client'
import type { LoginRequest, LoginPinRequest, LoginResponse } from '../../types'

export interface Empresa {
  id: string
  nombre: string
  logo_url: string | null
}

export const getEmpresas = () =>
  api.get<{ ok: boolean; data: Empresa[] }>('/empresas').then(r => r.data.data)

export const login = (data: LoginRequest) =>
  api.post<{ data: LoginResponse }>('/auth/login', data).then(r => r.data.data)

export const loginPin = (data: LoginPinRequest, tenantId: string) =>
  api.post<{ data: LoginResponse }>('/auth/login-pin', data, { headers: { 'X-Tenant-Id': tenantId } })
    .then(r => r.data.data)

export const logout = (refreshToken: string) =>
  api.post('/auth/logout', { refresh_token: refreshToken })
