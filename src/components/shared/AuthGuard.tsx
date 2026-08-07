import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { Spinner } from '../ui/Spinner'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const token = useAuthStore((s) => s.token)
  const usuario = useAuthStore((s) => s.usuario)
  const setToken = useAuthStore((s) => s.setToken)
  const restaurarSesion = useAuthStore((s) => s.restaurarSesion)
  const [checking, setChecking] = useState(!token)
  const attempted = useRef(false)

  useEffect(() => {
    if (token) return
    if (attempted.current) return
    attempted.current = true

    axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(async (r) => {
        const accessToken = r.data?.data?.access_token
        if (accessToken) {
          setToken(accessToken)
          try {
            const me = await axios.get(`${BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            })
            const u = me.data?.data
            if (u) {
              restaurarSesion(
                u,
                u.tenant_id || '',
                u.sucursal_id || ''
              )
            }
          } catch {
            // Si /me falla, el usuario navegará al login
          }
        }
      })
      .catch((err: unknown) => {
        const e = err as { response?: { status?: number; data?: { mensaje?: string } } }
        console.warn('[AuthGuard] Refresh fallido:', e?.response?.status, e?.response?.data?.mensaje || '')
      })
      .finally(() => setChecking(false))
  }, [token, setToken, restaurarSesion])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!token || !usuario) return <Navigate to="/login" replace />
  return <>{children}</>
}
