import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, X } from 'lucide-react'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { queryDefaults } from '../../../config/queries'
import {
  listarPromociones,
  crearPromocion,
  actualizarPromocion,
  reportePromociones,
  type PromocionPayload,
} from './api'
import { listarProductos } from '../productos/api'
import { PageHeader } from '../../../components/shared/PageHeader'
import { SidePanel } from '../../../components/shared/SidePanel'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { useToastStore } from '../../../store/toastStore'
import type { Promocion } from '../../../types'

const TIPO_LABEL: Record<string, string> = {
  porcentaje: 'Descuento %',
  dosxuno: '2x1',
  volumen: 'Por volumen',
  happy_hour: 'Happy hour',
}

const TIPO_BADGE: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
  porcentaje: 'warning',
  dosxuno: 'info',
  volumen: 'success',
  happy_hour: 'default',
}

const DIA_LABEL = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

const FORM_VACIO: PromocionPayload = {
  nombre: '',
  tipo: 'porcentaje',
  descuento_porcentaje: 10,
  volumen_minimo: null,
  hora_inicio: null,
  hora_fin: null,
  dias: null,
  vigente_desde: null,
  vigente_hasta: null,
  activo: true,
  productos: [],
}

const aPayload = (p: Promocion): PromocionPayload => ({
  nombre: p.nombre,
  tipo: p.tipo,
  descuento_porcentaje: p.descuento_porcentaje,
  volumen_minimo: p.volumen_minimo,
  hora_inicio: p.hora_inicio,
  hora_fin: p.hora_fin,
  dias: p.dias,
  vigente_desde: p.vigente_desde,
  vigente_hasta: p.vigente_hasta,
  activo: p.activo,
  productos: p.productos,
})

const HORA_LABEL = (h: string | null) => (h ? h.slice(0, 5) : null)

function PromoTipoBadge({ tipo }: { tipo: string }) {
  return <Badge variant={TIPO_BADGE[tipo] ?? 'default'}>{TIPO_LABEL[tipo] ?? tipo}</Badge>
}

export default function PromocionesPage() {
  const showToast = useToastStore((s) => s.show)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Promocion | null>(null)
  const [form, setForm] = useState<PromocionPayload>(FORM_VACIO)
  const [busquedaProducto, setBusquedaProducto] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['promociones'],
    queryFn: listarPromociones,
    ...queryDefaults('promociones'),
  })

  const { data: reporte } = useQuery({
    queryKey: ['promociones-reporte'],
    queryFn: () => reportePromociones(),
    ...queryDefaults('promociones'),
  })

  const { data: productos } = useQuery({
    queryKey: ['productos-promos'],
    queryFn: () => listarProductos({}),
    ...queryDefaults('productos'),
  })

  const crearMutation = useApiMutation({
    mutationFn: () => crearPromocion(form),
    queryKey: ['promociones'],
    successMessage: 'Promoción creada',
    onSuccess: () => cerrarPanel(),
  })

  const editarMutation = useApiMutation({
    mutationFn: () => (editando ? actualizarPromocion(editando.id, form) : Promise.reject(new Error('No editando'))),
    queryKey: ['promociones'],
    successMessage: 'Promoción actualizada',
    onSuccess: () => cerrarPanel(),
  })

  const abrirNueva = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setBusquedaProducto('')
    setPanelOpen(true)
  }

  const abrirEditar = (p: Promocion) => {
    setEditando(p)
    setForm(aPayload(p))
    setBusquedaProducto('')
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const guardar = () => {
    if (!form.nombre.trim()) { showToast({ type: 'error', message: 'El nombre es requerido' }); return }
    if (form.tipo !== 'dosxuno' && (form.descuento_porcentaje === null || form.descuento_porcentaje === undefined)) {
      showToast({ type: 'error', message: 'Indicá el porcentaje de descuento' }); return
    }
    if (editando) editarMutation.mutate(); else crearMutation.mutate()
  }

  const toggleProducto = (id: string) => {
    setForm((prev) => ({
      ...prev,
      productos: prev.productos.includes(id)
        ? prev.productos.filter((x) => x !== id)
        : [...prev.productos, id],
    }))
  }

  const productosFiltrados = useMemo(() => {
    const lista = productos ?? []
    const q = busquedaProducto.trim().toLowerCase()
    return q
      ? lista.filter((p) => p.nombre.toLowerCase().includes(q))
      : lista
  }, [productos, busquedaProducto])

  const columns: Column<Promocion>[] = [
    { key: 'nombre', header: 'Nombre', render: (p) => <span className="font-medium text-text-primary">{p.nombre}</span> },
    { key: 'tipo', header: 'Tipo', render: (p) => <PromoTipoBadge tipo={p.tipo} /> },
    {
      key: 'descuento_porcentaje',
      header: 'Aplica',
      render: (p) => {
        if (p.tipo === 'dosxuno') return <span className="text-xs text-text-secondary">Unidad gratis</span>
        const pct = p.descuento_porcentaje != null ? `${p.descuento_porcentaje}%` : '—'
        const min = p.volumen_minimo ? ` desde ${p.volumen_minimo} und.` : ''
        const hora = p.hora_inicio && p.hora_fin ? ` · ${HORA_LABEL(p.hora_inicio)}–${HORA_LABEL(p.hora_fin)}` : ''
        return <span className="text-xs text-text-secondary font-mono">{pct}{min}{hora}</span>
      },
    },
    {
      key: 'productos',
      header: 'Productos',
      render: (p) => <span className="text-xs text-text-secondary">{p.productos.length === 0 ? 'Todos' : `${p.productos.length} producto(s)`}</span>,
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (p) => <Badge variant={p.activo ? 'success' : 'danger'}>{p.activo ? 'Activa' : 'Inactiva'}</Badge>,
    },
  ]

  return (
    <>
      <div className="px-4 pb-4">
        <PageHeader
          title="Promociones"
          subtitle="Combos dinámicos y descuentos automáticos (2x1, %, volumen, happy hour)"
          onNew={abrirNueva}
          newLabel="Nueva promoción"
        />

        <DataTable
          data={data ?? []}
          columns={columns}
          keyExtractor={(p) => p.id}
          onRowClick={abrirEditar}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          emptyMessage="No hay promociones creadas"
        />

        {!isLoading && (
          <div className="dashboard-card p-5 mt-5">
            <h2 className="font-semibold text-sm text-text-primary mb-1">Reporte de efectividad</h2>
            <p className="text-[11px] text-text-secondary mb-4">Ventas pagadas con descuento de promoción y monto total descontado.</p>
            {(reporte ?? []).length === 0 ? (
              <p className="text-xs text-text-secondary">Todavía no hay ventas con promociones aplicadas.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(reporte ?? []).map((r) => (
                  <div key={r.id} className="rounded-xl border border-border/60 bg-bg-primary p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-text-primary truncate">{r.nombre}</span>
                      <PromoTipoBadge tipo={r.tipo} />
                    </div>
                    <p className="text-lg font-mono font-bold text-pos-accent mt-2">${Number(r.total_descontado).toFixed(2)}</p>
                    <p className="text-[11px] text-text-secondary font-mono">{r.ventas} venta(s) · {r.lineas} línea(s)</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SidePanel
        open={panelOpen}
        onClose={() => { if (!crearMutation.isPending && !editarMutation.isPending) cerrarPanel() }}
        title={editando ? `Editar promoción: ${editando.nombre}` : 'Nueva promoción'}
        direction="right"
      >
        <div className="flex flex-col gap-4 p-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: 2x1 en hamburguesas" />

          <Select
            label="Tipo"
            placeholder="Tipo"
            value={form.tipo}
            onValueChange={(tipo) => {
              const t = tipo as PromocionPayload['tipo']
              setForm((prev) => ({ ...prev, tipo: t, descuento_porcentaje: t === 'dosxuno' ? null : prev.descuento_porcentaje }))
            }}
            options={Object.entries(TIPO_LABEL).map(([value, label]) => ({ value, label }))}
          />

          {form.tipo !== 'dosxuno' && (
            <Input
              label="% de descuento"
              type="number" min="0" max="100"
              value={form.descuento_porcentaje != null ? String(form.descuento_porcentaje) : ''}
              onChange={(e) => setForm({ ...form, descuento_porcentaje: e.target.value === '' ? null : Number(e.target.value) })}
            />
          )}

          {form.tipo === 'volumen' && (
            <Input
              label="Cantidad mínima"
              type="number" min="2"
              value={form.volumen_minimo != null ? String(form.volumen_minimo) : ''}
              onChange={(e) => setForm({ ...form, volumen_minimo: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="2"
            />
          )}

          {form.tipo === 'happy_hour' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Desde" type="time" value={form.hora_inicio ?? ''} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value || null })} />
              <Input label="Hasta" type="time" value={form.hora_fin ?? ''} onChange={(e) => setForm({ ...form, hora_fin: e.target.value || null })} />
            </div>
          )}

          {form.tipo !== 'dosxuno' && form.tipo !== 'happy_hour' && (
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Días de la semana</p>
              <div className="flex gap-1.5 flex-wrap">
                {DIA_LABEL.map((d, i) => {
                  const activo = form.dias?.includes(i)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          dias: activo ? (prev.dias ?? []).filter((x) => x !== i) : [...(prev.dias ?? []), i],
                        }))
                      }
                      className={cn(
                        'size-8 rounded-lg border text-xs font-semibold transition-colors cursor-pointer',
                        activo ? 'bg-pos-accent/10 text-pos-accent border-pos-accent/30' : 'bg-bg-surface text-text-secondary border-border/60 hover:border-pos-accent/40',
                      )}
                    >
                      {d}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, dias: null })}
                  className={cn(
                    'h-8 px-2 rounded-lg border text-[10px] font-semibold transition-colors cursor-pointer',
                    !form.dias ? 'bg-pos-accent/10 text-pos-accent border-pos-accent/30' : 'bg-bg-surface text-text-secondary border-border/60',
                  )}
                >
                  Todos
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Productos</p>
            <p className="text-[10px] text-text-secondary mb-2">Sin seleccionar, aplica a todos los productos.</p>
            <Input
              type="search"
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              placeholder="Buscar producto..."
            />
            <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-border/60">
              {productosFiltrados.length === 0 ? (
                <p className="p-3 text-xs text-text-secondary">Sin productos.</p>
              ) : (
                productosFiltrados.map((p) => {
                  const sel = form.productos.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProducto(p.id)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-pos-accent/5 transition-colors cursor-pointer',
                        sel && 'bg-pos-accent/10',
                      )}
                    >
                      <Package className={cn('size-3.5 shrink-0', sel ? 'text-pos-accent' : 'text-text-secondary/50')} />
                      <span className="truncate flex-1">{p.nombre}</span>
                      {sel && <X className="size-3 text-pos-accent shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <Button className="w-full" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending}>
            {editando ? 'Guardar cambios' : 'Crear promoción'}
          </Button>
        </div>
      </SidePanel>
    </>
  )
}
