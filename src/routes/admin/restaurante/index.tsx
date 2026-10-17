import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Store, Grid2x2, Zap, BellRing, Link2, ExternalLink, Info } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { queryDefaults } from '../../../config/queries'
import { obtenerRestaurante, actualizarRestaurante, getEstadoFiscal, type Restaurante } from './api'
import { getConfigAlertas, guardarConfigAlertas, type AlertaConfig } from '../../dashboard/api'
import { PageHeader } from '../../../components/shared/PageHeader'
import { InlineError } from '../../../components/shared/InlineError'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

const CAMPO = 'text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2'

// F4 (spec «DTE única fuente de verdad de empresa y sucursal»): la identidad
// fiscal y la configuración de la empresa —incluidas las sucursales— se
// administran en el DTE Service. El POS solo las muestra (solo lectura) y
// enlaza al DTE para editarlas. Lo único editable aquí es la preferencia
// operativa `pos_default_mode` (decisión §7.3 de la spec).
const DTE_FRONTEND_URL = import.meta.env.VITE_DTE_FRONTEND_URL as string | undefined

const AMBIENTE_HACIENDA: Record<string, string> = {
  '00': 'No definido',
  '01': 'Pruebas',
  '02': 'Producción',
}

// El interceptor de axios convierte "01"/"02" en números (1, 2): se normaliza
// a 2 dígitos antes de mapear.
const etiquetaAmbiente = (ambiente: string | number | null | undefined) => {
  if (ambiente === null || ambiente === undefined || `${ambiente}`.trim() === '') return null
  const codigo = String(ambiente).padStart(2, '0')
  return AMBIENTE_HACIENDA[codigo] ?? codigo
}

function Dato({ label, value }: { label: string; value?: string | number | null }) {
  // El interceptor de axios convierte strings numéricos a number (p. ej. NRC
  // "3765751" o teléfono "22262386"), así que se normaliza a texto antes de
  // comparar: nunca llamar .trim() sobre el valor crudo.
  const texto = value === null || value === undefined ? '' : String(value)
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">{label}</span>
      <span className="text-sm text-text-primary font-body break-words">{texto.trim() ? texto : '—'}</span>
    </div>
  )
}

function AvisoDte({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-bg-primary p-3">
      <div className="flex items-start gap-2">
        <Info className="size-4 text-pos-accent shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary font-body">{children}</p>
      </div>
      {DTE_FRONTEND_URL && (
        <a
          href={DTE_FRONTEND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 w-fit text-xs font-semibold text-pos-accent hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Administrar en el DTE Service
        </a>
      )}
    </div>
  )
}

export default function RestaurantePage() {
  const { data: form, isLoading, error, refetch } = useQuery({
    queryKey: ['restaurante'],
    queryFn: obtenerRestaurante,
    ...queryDefaults('restaurante'),
  })

  // Del restaurante solo el modo del POS es editable; la identidad y la config
  // fiscal vienen del DTE (solo lectura).
  const [modoSeleccionado, setModoSeleccionado] = useState<Restaurante['pos_default_mode'] | null>(null)
  const modo = modoSeleccionado ?? form?.pos_default_mode ?? 'mesas'

  const { data: alertasConfig } = useQuery({
    queryKey: ['alertas-config'],
    queryFn: getConfigAlertas,
    ...queryDefaults('alertas-config'),
  })

  const [alertasForm, setAlertasForm] = useState<AlertaConfig | null>(null)
  const alertasInitRef = useRef(false)

  useEffect(() => {
    if (alertasConfig && !alertasInitRef.current) {
      alertasInitRef.current = true
      setAlertasForm(alertasConfig)
    }
  }, [alertasConfig])

  const { data: estadoFiscal, error: estadoFiscalError } = useQuery({
    queryKey: ['estado-fiscal'],
    queryFn: getEstadoFiscal,
    retry: false,
  })

  const estadoFiscalProhibido = (estadoFiscalError as AxiosError<unknown> | null)?.response?.status === 403
  const estadoFiscalVisible = Boolean(estadoFiscal) || (estadoFiscalError && !estadoFiscalProhibido)

  const alertasMutation = useApiMutation({
    mutationFn: () => {
      if (!alertasForm) return Promise.reject(new Error('Sin datos'))
      return guardarConfigAlertas({
        tendencia_caida_pct: alertasForm.tendencia_caida_pct,
        silencio_desde: alertasForm.silencio_desde,
        silencio_hasta: alertasForm.silencio_hasta,
        cooldown_minutos: alertasForm.cooldown_minutos,
      })
    },
    queryKey: ['alertas-config'],
    successMessage: 'Configuración de alertas guardada',
  })

  const setAlerta = <K extends keyof AlertaConfig>(key: K, value: AlertaConfig[K]) =>
    setAlertasForm(prev => (prev ? { ...prev, [key]: value } : prev))

  // F2: el backend responde 409 ante cualquier campo de empresa; se envía SOLO
  // la preferencia operativa del POS.
  const mutation = useApiMutation({
    mutationFn: () => actualizarRestaurante({ pos_default_mode: modo }),
    queryKey: ['restaurante'],
    successMessage: 'Modo del POS guardado',
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && !isLoading) {
    return (
      <div className="px-4 pb-4">
        <PageHeader title="Restaurante" subtitle="Configuración general del establecimiento" />
        <InlineError message="Error al cargar la configuración" onRetry={() => refetch()} />
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="px-4 pb-4">
      <PageHeader title="Restaurante" subtitle="Identidad (DTE) y configuración operativa del POS" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Identidad — solo lectura: fuente de verdad = DTE Service */}
        <section className="dashboard-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store className="size-4 text-pos-accent" />
            <h2 className="font-semibold text-sm text-text-primary">Identidad</h2>
            <Badge variant="default" className="ml-auto">Solo lectura</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Dato label="Nombre" value={form.nombre} />
            <Dato label="Nombre comercial" value={form.nombre_comercial} />
            <Dato label="NIT" value={form.nit} />
            <Dato label="NRC" value={form.nrc} />
            <Dato label="Dirección" value={form.direccion} />
            <Dato label="Teléfono" value={form.telefono} />
            <Dato label="Email" value={form.email} />
            <Dato label="Logo (URL)" value={form.logo_url} />
          </div>

          <div className="mt-4 border-t border-border/60 pt-4">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Configuración fiscal (DTE)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Dato label="Código de actividad" value={form.codigo_actividad} />
              <Dato label="Actividad económica" value={form.desc_actividad} />
              <Dato label="Ambiente Hacienda" value={etiquetaAmbiente(form.ambiente)} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Credenciales y firma
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={form.tiene_credenciales_hacienda ? 'success' : 'warning'}>
                    {form.tiene_credenciales_hacienda ? 'Hacienda lista' : 'Hacienda pendiente'}
                  </Badge>
                  <Badge variant={form.password_firma_configurada ? 'success' : 'warning'}>
                    {form.password_firma_configurada ? 'Firma lista' : 'Firma pendiente'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <AvisoDte>
            La identidad fiscal y la configuración de la empresa (incluidas las sucursales) se administran en el
            <span className="font-semibold text-text-primary"> DTE Service</span>. El POS solo las muestra.
          </AvisoDte>
        </section>

        {/* Operación — editable: preferencia operativa del POS */}
        <section className="dashboard-card p-5">
          <h2 className="font-semibold text-sm text-text-primary mb-4">Operación</h2>
          <p className={CAMPO}>Modo por defecto del POS</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'mesas', label: 'Mesas', desc: 'Mapa de mesas', icon: Grid2x2 },
              { key: 'rapido', label: 'Rápido', desc: 'Venta sin mesa', icon: Zap },
            ] as const).map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setModoSeleccionado(opt.key)}
                className={cn(
                  'flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer',
                  modo === opt.key
                    ? 'border-pos-accent bg-pos-accent/5'
                    : 'border-border bg-bg-surface hover:border-pos-accent/40',
                )}
              >
                <opt.icon className={cn('size-5', modo === opt.key ? 'text-pos-accent' : 'text-text-secondary')} />
                <div>
                  <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
                  <p className="text-[11px] text-text-secondary">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-secondary mt-3">
            Determina cómo arranca el punto de venta. El cajero puede cambiarlo en cada turno con F2.
          </p>
          <Button className="mt-4 w-full" onClick={() => mutation.mutate()} loading={mutation.isPending}>
            Guardar modo del POS
          </Button>
        </section>

        {/* Alertas */}
        <section className="dashboard-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BellRing className="size-4 text-pos-accent" />
            <h2 className="font-semibold text-sm text-text-primary">Alertas</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Umbral caída de ventas (%)"
                type="number"
                min={1}
                max={50}
                value={alertasForm?.tendencia_caida_pct ?? 10}
                onChange={(e) => setAlerta('tendencia_caida_pct', Number(e.target.value) || 10)}
              />
              <Input
                label="Cooldown al resolver (min)"
                type="number"
                min={0}
                max={1440}
                value={alertasForm?.cooldown_minutos ?? 120}
                onChange={(e) => setAlerta('cooldown_minutos', Number(e.target.value) || 0)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Silencio desde (HH:MM)"
                type="time"
                value={alertasForm?.silencio_desde ?? ''}
                onChange={(e) => setAlerta('silencio_desde', e.target.value || null)}
              />
              <Input
                label="Silencio hasta (HH:MM)"
                type="time"
                value={alertasForm?.silencio_hasta ?? ''}
                onChange={(e) => setAlerta('silencio_hasta', e.target.value || null)}
              />
            </div>
            <p className="text-[11px] text-text-secondary">
              Durante el horario silencioso las alertas no se notifican por tiempo real (el panel las sigue mostrando).
            </p>
            <Button onClick={() => alertasMutation.mutate()} loading={alertasMutation.isPending} variant="outline">
              Guardar alertas
            </Button>
          </div>
        </section>

        {/* Integración DTE (estado fiscal) — oculta si el rol no puede consultarlo (403) */}
        {estadoFiscalVisible && (
          <section className="dashboard-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="size-4 text-pos-accent" />
              <h2 className="font-semibold text-sm text-text-primary">Integración con DTE Service</h2>
            </div>
            {estadoFiscal ? (
              <div className="flex flex-col gap-3 text-sm font-body">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-secondary text-xs">Estado de provisión</span>
                  <Badge variant={
                    estadoFiscal.provisioning_status === 'active' ? 'success'
                      : estadoFiscal.provisioning_status === 'blocked' || estadoFiscal.provisioning_status === 'failed' ? 'danger'
                        : estadoFiscal.provisioning_status === 'provisioning' ? 'info' : 'warning'
                  }>
                    {estadoFiscal.provisioning_status === 'active' ? 'Activa'
                      : estadoFiscal.provisioning_status === 'pending_fiscal_setup' ? 'Configuración fiscal pendiente'
                        : estadoFiscal.provisioning_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-secondary text-xs">Credenciales Hacienda</span>
                  <Badge variant={estadoFiscal.credenciales_hacienda ? 'success' : 'warning'}>
                    {estadoFiscal.credenciales_hacienda ? 'Configuradas' : 'Pendientes'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-secondary text-xs">Certificado de firma</span>
                  <Badge variant={estadoFiscal.firma?.estado === 'listo' ? 'success' : 'warning'}>
                    {estadoFiscal.firma?.estado === 'listo' ? 'Listo' : estadoFiscal.firma?.estado === 'firmador_offline' ? 'Firmador fuera de línea' : estadoFiscal.firma?.estado === 'sin_credencial' ? 'Sin credencial' : (estadoFiscal.firma?.estado ?? '—')}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-text-secondary text-xs">Establecimientos vinculados</span>
                  {estadoFiscal.establecimientos.length === 0 ? (
                    <p className="text-xs text-text-secondary">Ninguno.</p>
                  ) : (
                    estadoFiscal.establecimientos.map((e) => (
                      <div key={e.establecimiento_id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-surface px-3 py-1.5">
                        <span className="font-mono text-[11px] text-text-secondary truncate">{e.branch_id ?? 'sin branch_id'}</span>
                        <Badge variant={
                          e.fiscal_status === 'ready' ? 'success'
                            : e.fiscal_status === 'blocked' ? 'danger'
                              : e.fiscal_status === 'inactive' ? 'default' : 'warning'
                        }>
                          {e.fiscal_status === 'ready' ? 'Listo' : e.fiscal_status === 'pending_mh_data' ? 'Datos MH pendientes' : e.fiscal_status === 'pending_link' ? 'Sin vínculo' : e.fiscal_status === 'blocked' ? 'Bloqueado' : 'Inactivo'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-[11px] text-text-secondary mt-1">
                  Fuente de verdad fiscal: DTE Service. El POS solo muestra estados operativos, nunca credenciales.
                </p>
              </div>
            ) : (
              <InlineError message="No se pudo consultar el estado fiscal" onRetry={() => refetch()} />
            )}
          </section>
        )}
      </div>
    </div>
  )
}
