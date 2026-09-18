import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Bell, CircleCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { queryDefaults } from '../../config/queries'
import { useAuthStore } from '../../store/authStore'
import { useSidebar } from '../../hooks/useSidebar'
import { useCajaActiva } from '../../hooks/useCajaActiva'
import { useAlertasSocket } from '../../hooks/useSocket'
import { Icon } from '../shared/Icon'
import { AlertCard } from '../shared/AlertCard'
import { ALERTA_ICONOS } from '../shared/alertIconos'
import { getAlertas, resolverAlerta } from '../../routes/dashboard/api'
import api from '../../api/client'
import { listarSucursales } from '../../routes/admin/sucursales/api'

const QUERIES_SUCURSAL = ['ordenes', 'mesas', 'cocina', 'caja-activa', 'resumen-diario', 'dashboard-metrics', 'alertas']

export function Topbar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const usuario = useAuthStore((s) => s.usuario)
  const tenantId = useAuthStore((s) => s.tenantId)
  const sucursalId = useAuthStore((s) => s.sucursalId)
  const setSucursalId = useAuthStore((s) => s.setSucursalId)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const token = useAuthStore((s) => s.token)
  const setMobileOpen = useSidebar((s) => s.setMobileOpen)
  const [loggingOut, setLoggingOut] = useState(false)
  const [hora, setHora] = useState('')
  const [sucursalOpen, setSucursalOpen] = useState(false)
  const [alertasOpen, setAlertasOpen] = useState(false)
  const sucursalRef = useRef<HTMLDivElement>(null)
  const alertasRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  useAlertasSocket(tenantId ?? '')

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

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (alertasRef.current && !alertasRef.current.contains(e.target as Node)) {
        setAlertasOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const { caja: cajaActiva, isError: cajaError, mensajeError: cajaMensaje } = useCajaActiva()

  const { data: alertas } = useQuery({
    queryKey: ['alertas', sucursalId],
    queryFn: getAlertas,
    ...queryDefaults('alertas'),
  })

  const resolverMutation = useMutation({
    mutationFn: resolverAlerta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
    },
  })

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

        {/* Alertas */}
        <div ref={alertasRef} className="relative">
          <button
            onClick={() => setAlertasOpen(!alertasOpen)}
            className="relative flex items-center gap-1 text-xs font-mono text-text-secondary px-2 py-1 rounded-lg bg-bg-primary border border-border/50 hover:border-pos-accent transition-all cursor-pointer"
            title="Alertas"
            aria-label={`Alertas (${alertas?.length ?? 0} activas)`}
            aria-expanded={alertasOpen}
          >
            <Bell className="size-3.5" />
            {(alertas?.length ?? 0) > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                {alertas!.length}
              </span>
            )}
          </button>

          {alertasOpen && (
            <div className="absolute right-0 mt-1.5 w-80 py-2 rounded-xl bg-bg-surface border border-border shadow-lg z-50">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Alertas activas
              </div>
              {(alertas?.length ?? 0) === 0 ? (
                <div className="px-3 py-3 text-xs text-text-secondary flex items-center gap-2">
                  <CircleCheck className="size-4 text-green-500 shrink-0" aria-hidden />
                  Sin alertas activas
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto flex flex-col gap-1.5 px-2 pb-1">
                  {alertas?.map(a => (
                    <AlertCard
                      key={a.id}
                      severity={a.severity}
                      icon={ALERTA_ICONOS[a.severity]}
                      title={a.titulo}
                      description={a.descripcion}
                      action={a.accion ? {
                        label: a.accion.label,
                        onClick: () => {
                          navigate(a.accion!.ruta)
                          setAlertasOpen(false)
                        },
                      } : undefined}
                    >
                      <button
                        onClick={() => resolverMutation.mutate(a.id)}
                        disabled={resolverMutation.isPending}
                        className="mt-1 text-[11px] font-semibold text-text-secondary hover:text-pos-accent transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {resolverMutation.isPending ? 'Resolviendo...' : 'Marcar como resuelta'}
                      </button>
                    </AlertCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
