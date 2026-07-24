import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { queryDefaults } from '../../config/queries'
import { useAuthStore } from '../../store/authStore'
import { useSidebar } from '../../hooks/useSidebar'
import { useCajaActiva } from '../../hooks/useCajaActiva'
import { Icon } from '../shared/Icon'
import api from '../../api/client'
import { listarSucursales } from '../../routes/admin/sucursales/api'

const QUERIES_SUCURSAL = ['ordenes', 'mesas', 'cocina', 'caja-activa', 'resumen-diario', 'dashboard-metrics']

export function Topbar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const usuario = useAuthStore((s) => s.usuario)
  const sucursalId = useAuthStore((s) => s.sucursalId)
  const setSucursalId = useAuthStore((s) => s.setSucursalId)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const token = useAuthStore((s) => s.token)
  const setMobileOpen = useSidebar((s) => s.setMobileOpen)
  const [loggingOut, setLoggingOut] = useState(false)
  const [hora, setHora] = useState('')
  const [sucursalOpen, setSucursalOpen] = useState(false)
  const sucursalRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const t = setInterval(() => {
      setHora(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (sucursalRef.current && !sucursalRef.current.contains(e.target as Node)) {
        setSucursalOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const { caja: cajaActiva, isError: cajaError, mensajeError: cajaMensaje } = useCajaActiva()

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: listarSucursales,
    ...queryDefaults('sucursales'),
  })

  const sucursalActual = sucursales?.find((s) => s.id === sucursalId)
  const tieneMultiplesSucursales = (sucursales?.length ?? 0) > 1

  const cambiarSucursal = (id: string) => {
    if (id === sucursalId) { setSucursalOpen(false); return }
    setSucursalId(id)
    setSucursalOpen(false)
    QUERIES_SUCURSAL.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      if (token) {
        await api.post('/auth/logout', {}, { withCredentials: true })
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
          <Icon name="menu" className="size-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Sucursal */}
        {sucursalActual && (
          <div ref={sucursalRef} className="relative">
            <button
              onClick={() => setSucursalOpen(!sucursalOpen)}
              className={`flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                tieneMultiplesSucursales
                  ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
                  : 'bg-bg-primary text-text-secondary border-border/50'
              }`}
              title={sucursalActual.nombre}
            >
              <span className="size-1.5 rounded-full bg-accent shrink-0" />
              <span className="max-w-24 truncate">{sucursalActual.nombre}</span>
              {tieneMultiplesSucursales && (
                <svg className={`size-3 transition-transform ${sucursalOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {tieneMultiplesSucursales && sucursalOpen && (
              <div className="absolute right-0 mt-1.5 w-48 py-1 rounded-xl bg-bg-surface border border-border shadow-lg z-50">
                {sucursales?.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => cambiarSucursal(s.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                      s.id === sucursalId
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full shrink-0 ${s.activo ? 'bg-accent' : 'bg-text-disabled'}`} />
                    <span className="truncate">{s.nombre}</span>
                    {s.es_principal && <span className="ml-auto text-[9px] uppercase tracking-wider text-text-muted font-semibold">Ppal</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="flex items-center gap-1 text-xs font-mono text-text-secondary px-2 py-1 rounded-lg bg-bg-primary border border-border/50 hover:border-pos-accent transition-all cursor-pointer"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        </button>

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-text-secondary px-2 py-1 rounded-lg bg-bg-primary border border-border/50">
          <Icon name="clock" className="size-3.5" />
          <span>{hora}</span>
        </div>

        {/* Caja badge */}
        {cajaError ? (
          <button
            onClick={() => navigate('/admin/caja')}
            title={cajaMensaje ?? 'Error de caja'}
            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all duration-200 cursor-pointer"
          >
            <Icon name="alert" className="size-3" />
            <span className="hidden sm:inline truncate max-w-24">{cajaMensaje ?? 'Error'}</span>
          </button>
        ) : cajaActiva?.estado === 'abierta' ? (
          <button
            onClick={() => navigate('/admin/caja')}
            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-status-libre/10 text-status-libre border border-status-libre/30 hover:bg-status-libre/20 transition-all duration-200 cursor-pointer"
          >
            <span className="size-1.5 rounded-full bg-status-libre animate-pulse" />
            Caja Abierta
          </button>
        ) : (
          <button
            onClick={() => navigate('/admin/caja')}
            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-status-pendiente/10 text-status-pendiente border border-status-pendiente/30 hover:bg-status-pendiente/20 transition-all duration-200 cursor-pointer"
          >
            <span className="size-1.5 rounded-full bg-status-pendiente" />
            Caja Cerrada
          </button>
        )}

        {/* User avatar + name */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-bg-primary border border-border/50">
          <div className="size-6 rounded-full bg-pos-accent/20 flex items-center justify-center text-pos-accent font-display text-[10px] font-bold">
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
          <Icon name="log-out" className="size-3.5" />
          <span className="hidden sm:inline">{loggingOut ? '...' : 'Salir'}</span>
        </button>
      </div>
    </header>
  )
}
