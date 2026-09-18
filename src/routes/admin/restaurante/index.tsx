import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Store, Grid2x2, Zap, BellRing } from 'lucide-react'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { queryDefaults } from '../../../config/queries'
import { obtenerRestaurante, actualizarRestaurante, type Restaurante } from './api'
import { getConfigAlertas, guardarConfigAlertas, type AlertaConfig } from '../../dashboard/api'
import { PageHeader } from '../../../components/shared/PageHeader'
import { InlineError } from '../../../components/shared/InlineError'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

const CAMPO = 'text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2'

export default function RestaurantePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['restaurante'],
    queryFn: obtenerRestaurante,
    ...queryDefaults('restaurante'),
  })

  const [form, setForm] = useState<Restaurante | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (data && !initializedRef.current) {
      initializedRef.current = true
      setForm(data)
    }
  }, [data])

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

  const mutation = useApiMutation({
    mutationFn: () => {
      if (!form) return Promise.reject(new Error('Sin datos'))
      return actualizarRestaurante({
        nombre: form.nombre,
        nit: form.nit ?? undefined,
        nrc: form.nrc ?? undefined,
        direccion: form.direccion ?? undefined,
        telefono: form.telefono ?? undefined,
        email: form.email ?? undefined,
        logo_url: form.logo_url ?? undefined,
        pos_default_mode: form.pos_default_mode,
      })
    },
    queryKey: ['restaurante'],
    successMessage: 'Configuración del restaurante guardada',
  })

  const set = <K extends keyof Restaurante>(key: K, value: Restaurante[K]) =>
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))

  const guardar = () => { if (form) mutation.mutate() }

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
      <PageHeader title="Restaurante" subtitle="Identidad y configuración operativa del establecimiento" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Identidad */}
        <section className="dashboard-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store className="size-4 text-pos-accent" />
            <h2 className="font-semibold text-sm text-text-primary">Identidad</h2>
            {form.plan && <Badge variant="info" className="ml-auto">{form.plan}</Badge>}
          </div>
          <div className="flex flex-col gap-4">
            <Input label="Nombre" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="NIT" value={form.nit ?? ''} onChange={(e) => set('nit', e.target.value)} />
              <Input label="NRC" value={form.nrc ?? ''} onChange={(e) => set('nrc', e.target.value)} />
            </div>
            <Input label="Dirección" value={form.direccion ?? ''} onChange={(e) => set('direccion', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Teléfono" value={form.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} />
              <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <Input label="Logo (URL)" value={form.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://..." />
          </div>
        </section>

        {/* Operación */}
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
                onClick={() => set('pos_default_mode', opt.key)}
                className={cn(
                  'flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer',
                  form.pos_default_mode === opt.key
                    ? 'border-pos-accent bg-pos-accent/5'
                    : 'border-border bg-bg-surface hover:border-pos-accent/40',
                )}
              >
                <opt.icon className={cn('size-5', form.pos_default_mode === opt.key ? 'text-pos-accent' : 'text-text-secondary')} />
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
      </div>

      <div className="flex justify-end mt-5">
        <Button onClick={guardar} loading={mutation.isPending}>
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
