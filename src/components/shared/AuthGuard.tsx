import { useEffect, useState } from 'react'
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
  const setToken = useAuthStore((s) => s.setToken)
  const [checking, setChecking] = useState(!token)

  useEffect(() => {
    if (token) {
      setChecking(false)
      return
    }
    axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((r) => {
        if (r.data?.data?.access_token) setToken(r.data.data.access_token)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [token, setToken])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
