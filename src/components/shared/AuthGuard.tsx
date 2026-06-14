import { Navigate } from 'react-router-dom'
import { STORAGE_KEYS } from '../../config/constants'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
