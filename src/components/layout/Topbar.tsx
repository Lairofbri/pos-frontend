import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { useAuthStore } from '../../store/authStore'
import { useSidebar } from '../../hooks/useSidebar'
import { Badge } from '../ui/Badge'
import { ZoneSelector } from '../ui/ZoneSelector'
import { Icon } from '../shared/Icon'
import { STORAGE_KEYS } from '../../config/constants'
import { getCajaActiva } from '../../routes/admin/caja/api'
import { logout } from '../../routes/login/api'

export function Topbar() {
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const token = useAuthStore((s) => s.token)
  const setMobileOpen = useSidebar((s) => s.setMobileOpen)
  const [loggingOut, setLoggingOut] = useState(false)

  const { data: cajaActiva } = useQuery({
    queryKey: ['caja-activa'],
    queryFn: getCajaActiva,
    ...queryDefaults('caja-activa'),
  })

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      if (refreshToken && token) {
        await logout(refreshToken)
      }
    } catch {
      // cerrar sesión aunque falle la petición
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-bg-surface/50 glass shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Abrir menú"
        >
          <Icon name="menu" className="w-5 h-5" />
        </button>
        <ZoneSelector />
      </div>

      <div className="flex items-center gap-4">
        {cajaActiva?.estado === 'abierta' ? (
          <Badge variant="success">Caja: ${cajaActiva.total_esperado.toFixed(2)}</Badge>
        ) : (
          <Badge variant="danger">Caja Cerrada</Badge>
        )}
        <span className="text-xs text-text-secondary font-mono">
          {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-sm text-text-primary font-body font-medium">
          {usuario?.nombre || 'Usuario'}
        </span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-xs text-text-secondary hover:text-danger transition-colors cursor-pointer disabled:opacity-50"
        >
          {loggingOut ? '...' : 'Salir'}
        </button>
      </div>
    </header>
  )
}
