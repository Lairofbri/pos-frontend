import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import type { Usuario } from '../types'

export function useAuth() {
  const { token, usuario, tenantId, setAuth, setTenantId, clearAuth } = useAuthStore()

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<{ data: Usuario }>('/auth/me').then(r => r.data.data),
    enabled: !!token,
  })

  if (me && !usuario) {
    setAuth(token!, me)
  }

  return {
    token,
    usuario: usuario || me || null,
    tenantId,
    isAuthenticated: !!token,
    setAuth,
    setTenantId,
    clearAuth,
  }
}
