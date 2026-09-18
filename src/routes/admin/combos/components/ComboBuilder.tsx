import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Minus, X, Package, ChefHat, Scale,
  TriangleAlert, CircleCheck, CircleDollarSign, ArrowLeft,
} from 'lucide-react'
import { queryDefaults } from '../../../../config/queries'
import { listarProductos } from '../../productos/api'
import { crearCombo, actualizarCombo, eliminarCombo, obtenerCombo } from '../api'
import type { Producto, ComboProducto } from '../../../../types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { CountUp } from '@/routes/dashboard/components/CountUp'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'

type FiltroTipo = 'todos' | 'stock' | 'receta'

const FILTROS: { key: FiltroTipo; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'stock', label: 'Stock directo' },
  { key: 'receta', label: 'Con receta' },
]

const moneda = (v: number) => `$${v.toFixed(2)}`

function EstadoCosto({ costo, precio }: { costo: number; precio: number }) {
  if (costo <= 0) return <Badge variant="default">Sin datos de costo</Badge>
  const margen = precio - costo
  const pct = precio > 0 ? (margen / precio) * 100 : 0
  if (margen < 0) return <Badge variant="danger">Pérdida</Badge>
  if (pct < 20) return <Badge variant="warning">Equilibrio</Badge>
  return <Badge variant="success">Rentable</Badge>
}

function EstadoStock({ p }: { p: Producto }) {
  if (!p.tiene_stock) return null
  const necesidad = 1
  const ratio = Math.min(1, p.stock_actual / Math.max(necesidad, 1))
  const color = p.stock_actual <= 0 ? 'bg-danger' : p.stock_actual < necesidad ? 'bg-warning' : 'bg-success'
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-300', color)} style={{ width: `${Math.max(6, ratio * 100)}%` }} />
      </div>
      <span className="text-[11px] font-mono text-text-secondary tabular-nums">
        {p.stock_actual} {p.unidad_medida_id ? '' : 'u'}
      </span>
    </div>
  )
}

export function ComboBuilder({ comboId }: { comboId?: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const esEdicion = !!comboId

  const [form, setForm] = useState({ nombre: '', precio: '' })
  const [activo, setActivo] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [seleccion, setSeleccion] = useState<Record<string, number>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [costoGuardado, setCostoGuardado] = useState<number | undefined>(undefined)

  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: () => listarProductos({}),
    ...queryDefaults('productos'),
  })

  const { data: combo, isLoading: comboLoading } = useQuery({
    queryKey: ['combo', comboId],
    queryFn: () => obtenerCombo(comboId!),
    enabled: !!comboId,
    ...queryDefaults('combo'),
  })

  const initializedRef = useRef(false)

  useEffect(() => {
    if (combo && !initializedRef.current) {
      initializedRef.current = true
      setForm({ nombre: combo.nombre, precio: combo.precio.toString() })
      setActivo(combo.activo)
      setCostoGuardado(combo.costo_estimado)
      const sel: Record<string, number> = {}
      combo.productos.forEach((p) => { sel[p.producto_id] = p.cantidad })
      setSeleccion(sel)
    }
  }, [combo])

  const productosDisponibles = useMemo(() => {
    const lista = (productos ?? []).filter((p) => p.activo)
    const q = busqueda.trim().toLowerCase()
    return lista.filter((p) => {
      if (filtroTipo === 'stock' && !p.tiene_stock) return false
      if (filtroTipo === 'receta' && !p.tiene_receta) return false
      if (q && !p.nombre.toLowerCase().includes(q)) return false
      return true
    })
  }, [productos, busqueda, filtroTipo])

  const componentes: (ComboProducto & { nombre?: string; costo_promedio?: number; tiene_stock?: boolean; tiene_receta?: boolean; imagen_url?: string; unidad_abreviatura?: string; stock_actual?: number })[] = useMemo(() => {
    return Object.entries(seleccion)
      .map(([pid, cantidad]) => {
        const p = (productos ?? []).find((x) => x.id === pid)
        return {
          producto_id: pid,
          cantidad,
          nombre: p?.nombre ?? '',
          costo_promedio: p?.costo_promedio ?? 0,
          tiene_stock: p?.tiene_stock,
          tiene_receta: p?.tiene_receta,
          imagen_url: p?.imagen_url,
          unidad_abreviatura: undefined,
          stock_actual: p?.stock_actual,
        }
      })
      .filter((c) => c.nombre)
  }, [seleccion, productos])

  const costoEstimado = useMemo(() => {
    return Math.round(componentes.reduce((sum, c) => sum + (c.costo_promedio ?? 0) * c.cantidad, 0) * 100) / 100
  }, [componentes])

  const precioNum = parseFloat(form.precio || '0')
  const margen = precioNum - costoEstimado
  const margenPct = precioNum > 0 ? (margen / precioNum) * 100 : 0

  const crearMutation = useMutation({
    mutationFn: () =>
      crearCombo({
        nombre: form.nombre,
        precio: precioNum,
        productos: Object.entries(seleccion).map(([producto_id, cantidad]) => ({ producto_id, cantidad })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] })
      showToast({ type: 'success', message: 'Combo creado' })
      navigate('/admin/combos')
    },
    onError: () => showToast({ type: 'error', message: 'Error al crear combo' }),
  })

  const editarMutation = useMutation({
    mutationFn: () =>
      actualizarCombo(comboId!, {
        nombre: form.nombre,
        precio: precioNum,
        productos: Object.entries(seleccion).map(([producto_id, cantidad]) => ({ producto_id, cantidad })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] })
      queryClient.invalidateQueries({ queryKey: ['combo', comboId] })
      showToast({ type: 'success', message: 'Combo actualizado' })
      navigate('/admin/combos')
    },
    onError: () => showToast({ type: 'error', message: 'Error al actualizar combo' }),
  })

  const toggleActivoMutation = useMutation({
    mutationFn: (v: boolean) => actualizarCombo(comboId!, { activo: v }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] })
      queryClient.invalidateQueries({ queryKey: ['combo', comboId] })
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: () => eliminarCombo(comboId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] })
      showToast({ type: 'success', message: 'Combo desactivado' })
      navigate('/admin/combos')
    },
    onError: () => showToast({ type: 'error', message: 'Error al desactivar combo' }),
  })

  const cambiarCantidad = (pid: string, delta: number) => {
    setSeleccion((prev) => {
      const next = { ...prev }
      const nuevo = (next[pid] ?? 0) + delta
      if (nuevo <= 0) delete next[pid]
      else next[pid] = nuevo
      return next
    })
  }

  const agregar = (pid: string) => {
    setSeleccion((prev) => ({ ...prev, [pid]: (prev[pid] ?? 0) + 1 }))
  }

  const guardar = () => {
    if (esEdicion) editarMutation.mutate()
    else crearMutation.mutate()
  }

  const valido = form.nombre.trim().length >= 2 && precioNum > 0 && componentes.length > 0

  if (esEdicion && comboLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-text-secondary font-body">Cargando combo…</span>
      </div>
    )
  }

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/admin/combos')}
          className="size-8 rounded-xl border border-border bg-bg-surface flex items-center justify-center text-text-secondary hover:text-pos-accent hover:border-pos-accent transition-all cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="font-display text-xl text-text-primary tracking-tight">
            {esEdicion ? `Editar combo — ${combo?.nombre ?? ''}` : 'Armar nuevo combo'}
          </h1>
          <p className="text-xs text-text-secondary font-body mt-0.5">
            Elegí los componentes del catálogo; el inventario se descuenta por componente al pagar.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
        {/* ── Catálogo ─────────────────────────────── */}
        <section className="dashboard-card">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
              <Input
                placeholder="Buscar productos…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {FILTROS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltroTipo(f.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold font-body border-2 transition-all cursor-pointer',
                    filtroTipo === f.key
                      ? 'border-pos-accent bg-pos-accent/10 text-pos-accent'
                      : 'border-border text-text-secondary hover:border-pos-accent/50',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {productosDisponibles.map((p, i) => {
              const agregado = seleccion[p.id] != null
              return (
                <button
                  key={p.id}
                  onClick={() => { if (!agregado) agregar(p.id) }}
                  disabled={agregado}
                  className={cn(
                    'group relative text-left rounded-2xl border-2 p-3 transition-all cursor-pointer',
                    'animate-fadeInUp',
                    agregado
                      ? 'border-pos-accent/60 bg-pos-accent/5 opacity-70 cursor-default'
                      : 'border-border bg-bg-surface hover:border-pos-accent hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(199,102,46,0.12)] active:scale-[0.98]',
                  )}
                  style={{ animationDelay: `${Math.min(i, 11) * 0.04}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-12 shrink-0 rounded-xl bg-bg-surface-hover border border-border overflow-hidden flex items-center justify-center">
                      {p.imagen_url ? (
                        <img src={p.imagen_url} alt={p.nombre} className="size-full object-cover" loading="lazy" />
                      ) : p.tiene_receta ? (
                        <ChefHat className="size-5 text-pos-accent" />
                      ) : (
                        <Package className="size-5 text-pos-accent" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold font-body text-text-primary truncate">{p.nombre}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {p.tiene_receta && <Badge variant="info">Receta</Badge>}
                        {p.tiene_stock && <Badge variant="default">Stock</Badge>}
                        {!p.se_vende && <Badge variant="warning">Insumo</Badge>}
                      </div>
                      <p className="text-xs font-mono text-text-secondary mt-1">
                        ${p.precio.toFixed(2)}
                        {p.costo_promedio > 0 && <span className="text-text-secondary/70"> · costo ${p.costo_promedio.toFixed(2)}</span>}
                      </p>
                      <EstadoStock p={p} />
                    </div>
                    {!agregado && (
                      <span className="size-7 shrink-0 rounded-lg bg-pos-accent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="size-4" />
                      </span>
                    )}
                    {agregado && (
                      <span className="size-7 shrink-0 rounded-lg bg-success/15 text-success flex items-center justify-center">
                        <CircleCheck className="size-4" />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
            {productosDisponibles.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-text-secondary font-body">
                Sin productos para mostrar.
              </div>
            )}
          </div>
        </section>

        {/* ── Receta del combo ─────────────────────── */}
        <aside className="dashboard-card lg:sticky lg:top-4">
          <div className="flex flex-col gap-4">
            <Input
              label="Nombre del combo"
              placeholder="Ej: Combo Hamburguesa + Papas"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <Input
              label="Precio de venta"
              type="number"
              step="0.01"
              min="0"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Componentes ({componentes.length})
                </span>
              </div>
              {componentes.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
                  <Package className="size-6 mx-auto text-text-secondary/60" />
                  <p className="text-xs text-text-secondary font-body mt-2">Agregá productos desde el catálogo.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {componentes.map((c) => (
                    <div key={c.producto_id} className="flex items-center gap-2 rounded-xl border border-border bg-bg-surface px-3 py-2">
                      <div className="size-8 shrink-0 rounded-lg bg-bg-surface-hover border border-border flex items-center justify-center overflow-hidden">
                        {c.imagen_url ? (
                          <img src={c.imagen_url} alt={c.nombre} className="size-full object-cover" />
                        ) : c.tiene_receta ? (
                          <ChefHat className="size-4 text-pos-accent" />
                        ) : (
                          <Package className="size-4 text-pos-accent" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-body text-text-primary truncate">{c.nombre}</p>
                        <p className="text-[11px] font-mono text-text-secondary">
                          {c.costo_promedio && c.costo_promedio > 0
                            ? `costo ${moneda(c.costo_promedio * c.cantidad)}`
                            : c.tiene_receta
                              ? 'costo de receta al guardar'
                              : 'sin costo'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cambiarCantidad(c.producto_id, -1)}
                          className="size-6 rounded-md bg-bg-surface border border-border text-text-secondary hover:text-pos-accent hover:border-pos-accent transition-colors cursor-pointer flex items-center justify-center"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="font-mono text-sm text-text-primary w-6 text-center tabular-nums">{c.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(c.producto_id, 1)}
                          className="size-6 rounded-md bg-bg-surface border border-border text-text-secondary hover:text-pos-accent hover:border-pos-accent transition-colors cursor-pointer flex items-center justify-center"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => cambiarCantidad(c.producto_id, -c.cantidad)}
                        className="text-text-secondary hover:text-danger transition-colors cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-bg-surface-hover border border-border p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="size-3.5" /> Costo estimado
                </span>
                <span className="font-mono text-lg text-text-primary tabular-nums">
                  <CountUp end={costoEstimado} prefix="$" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <CircleDollarSign className="size-3.5" /> Margen bruto
                </span>
                <span className={cn('font-mono text-lg tabular-nums', margen < 0 ? 'text-danger' : 'text-success')}>
                  <CountUp end={margen} prefix={margen < 0 ? '-$' : '$'} />
                  <span className="text-xs ml-1 text-text-secondary">
                    {precioNum > 0 && costoEstimado > 0 ? `${margenPct.toFixed(1)}%` : ''}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Estado</span>
                <EstadoCosto costo={costoEstimado} precio={precioNum} />
              </div>
              {costoGuardado != null && Math.abs(costoGuardado - costoEstimado) > 0.01 && (
                <p className="text-[11px] text-text-secondary font-body">
                  Costo con recetas al guardar: {moneda(costoGuardado)}
                </p>
              )}
            </div>

            {esEdicion && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-bg-surface px-4 py-3">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Visible en POS</span>
                <Toggle
                  checked={activo}
                  onChange={(v) => { setActivo(v); toggleActivoMutation.mutate(v) }}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending} disabled={!valido}>
                {esEdicion ? 'Guardar cambios' : 'Crear combo'}
              </Button>
              {esEdicion && (
                <Button variant="outline" onClick={() => setConfirmDelete(true)}>Desactivar</Button>
              )}
            </div>

            {componentes.some((c) => c.tiene_stock && (c.stock_actual ?? 0) < c.cantidad) && (
              <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5">
                <TriangleAlert className="size-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs font-body text-text-secondary">
                  Algunos componentes no tienen stock suficiente para un combo. Se podrá agregar al ticket con advertencia, pero el pago se bloqueará si el stock no se repone.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Desactivar combo"
        message={`¿Desactivar "${combo?.nombre ?? ''}"? Dejará de aparecer en POS.`}
        onConfirm={() => eliminarMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
        loading={eliminarMutation.isPending}
      />
    </div>
  )
}
