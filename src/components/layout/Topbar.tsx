import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { useAuthStore } from '../../store/authStore'
import { useSidebar } from '../../hooks/useSidebar'
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
  const [hora, setHora] = useState('')

  useEffect(() => {
    const t = setInterval(() => {
      setHora(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    return () => clearInterval(t)
  }, [])

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
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-bg-surface/50 glass-light shrink-0">
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

      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-secondary px-2 py-1 rounded-lg bg-bg-primary border border-border/50">
          <Icon name="clock" className="w-3.5 h-3.5" />
          <span>{hora}</span>
        </div>

        {/* Caja badge */}
        {cajaActiva?.estado === 'abierta' ? (
          <button
            onClick={() => navigate('/admin/caja')}
            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-status-libre/10 text-status-libre border border-status-libre/30 hover:bg-status-libre/20 transition-all duration-200 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-status-libre animate-pulse" />
            Caja Abierta
          </button>
        ) : (
          <button
            onClick={() => navigate('/admin/caja')}
            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-status-pendiente/10 text-status-pendiente border border-status-pendiente/30 hover:bg-status-pendiente/20 transition-all duration-200 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-status-pendiente" />
            Caja Cerrada
          </button>
        )}

        {/* User avatar + name */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-bg-primary border border-border/50">
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent font-display text-[10px] font-bold">
            {(usuario?.nombre ?? 'U').charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-text-primary font-body font-medium hidden sm:inline">
            {usuario?.nombre || 'Usuario'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-danger transition-colors cursor-pointer disabled:opacity-50 px-1"
        >
          <Icon name="log-out" className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{loggingOut ? '...' : 'Salir'}</span>
        </button>
      </div>
    </header>
  )
}
