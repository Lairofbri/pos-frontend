import api from '../../api/client'
import type { LoginRequest, LoginPinRequest, LoginResponse } from '../../types'

export const getTenants = () =>
  api.get<{ ok: boolean; data: { id: string; nombre: string; logo_url?: string }[] }>('/auth/tenants')
    .then(r => r.data.data)

export const login = (data: LoginRequest) =>
  api.post<{ data: LoginResponse }>('/auth/login', data).then(r => r.data.data)

export const loginPin = (data: LoginPinRequest) =>
  api.post<{ data: LoginResponse }>('/auth/login-pin', data).then(r => r.data.data)

export const logout = (refreshToken: string) =>
  api.post('/auth/logout', { refresh_token: refreshToken })
