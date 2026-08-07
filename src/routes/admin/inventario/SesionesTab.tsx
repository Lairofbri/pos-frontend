import { useState } from 'react'
import { ClipboardList, Plus, Search, Trash2, AlertTriangle, ArrowLeft, Building2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listarSesiones, crearSesion, obtenerSesion, registrarConteo,
  eliminarConteo, cerrarSesion, cancelarSesion, listarUnidades,
} from './api'
import type { SesionItem, SesionDetalle } from './api'
import { listarProductos } from '../productos/api'
import { useToastStore } from '../../../store/toastStore'
import { SidePanel } from '../../../components/shared/SidePanel'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

const estadoBadge: Record<string, 'success' | 'default' | 'danger'> = {
  abierta: 'success',
  cerrada: 'default',
  cancelada: 'danger',
}

export default function SesionesTab() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  const [view, setView] = useState<'lista' | 'conteo' | 'detalle' | 'conciliacion'>('lista')
  const [sesionActiva, setSesionActiva] = useState<string | null>(null)
  const [nuevaPanelOpen, setNuevaPanelOpen] = useState(false)
  const [nuevaForm, setNuevaForm] = useState({ sucursal_id: '', notas: '' })

  const [searchProducto, setSearchProducto] = useState('')
  const [conteoForm, setConteoForm] = useState({ producto_id: '', stock_fisico: '', unidad_medida_id: '' })

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ sesionId: string; productoId: string; nombre: string } | null>(null)

  const { data: sesionesData, isLoading: sesLoad } = useQuery({
    queryKey: ['inventario-sesiones'],
    queryFn: () => listarSesiones({ pagina: 1, limite: 50 }),
  })

  const sesionDetalle = useQuery({
    queryKey: ['inventario-sesion', sesionActiva],
    queryFn: () => obtenerSesion(sesionActiva!),
    enabled: !!sesionActiva && (view === 'conteo' || view === 'conciliacion' || view === 'detalle'),
  })

  const { data: productosStock } = useQuery({
    queryKey: ['productos-stock', ''],
    queryFn: () => listarProductos({ tiene_stock: true, limite: 500 }),
    enabled: view === 'conteo',
  })

  const { data: unidades } = useQuery({
    queryKey: ['unidades-medida'],
    queryFn: listarUnidades,
  })

  const crearSesionMutation = useMutation({
    mutationFn: () => crearSesion({
      sucursal_id: nuevaForm.sucursal_id || undefined,
      notas: nuevaForm.notas || undefined,
    }),
    onSuccess: (sesion) => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sesiones'] })
      setNuevaPanelOpen(false)
      setSesionActiva(sesion.id)
      setView('conteo')
      showToast({ type: 'success', message: 'Sesión de inventario iniciada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al crear sesión. ¿Ya hay una abierta para esta sucursal?' }),
  })

  const registrarMutation = useMutation({
    mutationFn: () => registrarConteo(sesionActiva!, {
      producto_id: conteoForm.producto_id,
      stock_fisico: parseFloat(conteoForm.stock_fisico),
      unidad_medida_id: conteoForm.unidad_medida_id || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sesion', sesionActiva] })
      setConteoForm({ producto_id: '', stock_fisico: '', unidad_medida_id: '' })
      setSearchProducto('')
      showToast({ type: 'success', message: 'Conteo registrado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al registrar conteo' }),
  })

  const eliminarConteoMutation = useMutation({
    mutationFn: ({ sesionId, productoId }: { sesionId: string; productoId: string }) =>
      eliminarConteo(sesionId, productoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sesion', sesionActiva] })
      setDeleteConfirm(null)
      showToast({ type: 'success', message: 'Conteo eliminado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al eliminar conteo' }),
  })

  const cerrarMutation = useMutation({
    mutationFn: (lineas: { producto_id: string; aplicar: boolean }[]) =>
      cerrarSesion(sesionActiva!, { lineas }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sesiones'] })
      queryClient.invalidateQueries({ queryKey: ['inventario-sesion', sesionActiva] })
      setView('detalle')
      showToast({ type: 'success', message: `Sesión cerrada. ${result.ajustes_aplicados} ajustes aplicados.` })
    },
    onError: () => showToast({ type: 'error', message: 'Error al cerrar sesión' }),
  })

  const cancelarMutation = useMutation({
    mutationFn: () => cancelarSesion(sesionActiva!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-sesiones'] })
      setCancelConfirmOpen(false)
      setView('lista')
      setSesionActiva(null)
      showToast({ type: 'success', message: 'Sesión cancelada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al cancelar sesión' }),
  })

  const abrirSesion = (sesion: SesionItem) => {
    setSesionActiva(sesion.id)
    if (sesion.estado === 'abierta') {
      setView('conteo')
    } else {
      setView('detalle')
    }
  }

  const volverALista = () => {
    setSesionActiva(null)
    setView('lista')
  }

  const sesion = sesionDetalle.data
  const productosFiltrados = productosStock?.filter((p) => {
    if (!searchProducto) return false
    const yaContado = sesion?.conteos?.some(c => c.producto_id === p.id)
    return !yaContado && p.nombre.toLowerCase().includes(searchProducto.toLowerCase())
  })

  if (sesLoad) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  if (view === 'lista') {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-secondary">
            {(sesionesData?.paginacion?.total ?? 0)} sesiones
          </span>
          <Button size="sm" onClick={() => setNuevaPanelOpen(true)}>
            <Plus className="size-4 mr-1" /> Nueva sesión
          </Button>
        </div>

        {!sesionesData?.sesiones?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <ClipboardList className="size-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay sesiones de inventario</p>
            <p className="text-xs mt-1">Creá una para empezar un conteo físico.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sesionesData.sesiones.map((s) => (
              <div
                key={s.id}
                onClick={() => abrirSesion(s)}
                className="bg-white border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-accent hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-text-primary">
                    {new Date(s.creado_en).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge variant={estadoBadge[s.estado] ?? 'default'} className="text-[10px] capitalize">
                    {s.estado}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Building2 className="size-3" />
                  <span>{s.sucursal_nombre || 'General'}</span>
                  <span className="opacity-50">|</span>
                  <ClipboardList className="size-3" />
                  <span>{s.productos_contados}/{s.total_productos_con_stock} contados</span>
                </div>
                {s.notas && (
                  <p className="text-xs text-text-secondary mt-1.5 truncate">{s.notas}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <NuevaSesionPanel
          open={nuevaPanelOpen}
          onClose={() => setNuevaPanelOpen(false)}
          form={nuevaForm}
          setForm={setNuevaForm}
          onCrear={() => crearSesionMutation.mutate()}
          loading={crearSesionMutation.isPending}
        />
      </>
    )
  }

  if (view === 'detalle' && sesion) {
    return (
      <DetalleSesionView sesion={sesion} onVolver={volverALista} />
    )
  }

  if ((view === 'conteo' || view === 'conciliacion') && sesion) {
    return (
      <ConteoView
        sesion={sesion}
        view={view}
        setView={setView}
        onVolver={volverALista}
        searchProducto={searchProducto}
        setSearchProducto={setSearchProducto}
        conteoForm={conteoForm}
        setConteoForm={setConteoForm}
        productosFiltrados={productosFiltrados ?? []}
        unidades={unidades ?? []}
        registrarMutation={registrarMutation}
        eliminarMutation={eliminarConteoMutation}
        cerrarMutation={cerrarMutation}
        cancelarMutation={cancelarMutation}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        cancelConfirmOpen={cancelConfirmOpen}
        setCancelConfirmOpen={setCancelConfirmOpen}
      />
    )
  }

  return null
}

function NuevaSesionPanel({
  open, onClose, form, setForm, onCrear, loading,
}: {
  open: boolean
  onClose: () => void
  form: { sucursal_id: string; notas: string }
  setForm: (f: { sucursal_id: string; notas: string }) => void
  onCrear: () => void
  loading: boolean
}) {
  return (
    <SidePanel open={open} onClose={onClose} title="Nueva sesión de inventario">
      <div className="flex flex-col gap-4 p-4">
        <p className="text-xs text-text-secondary">
          Al iniciar la sesión se capturará el stock actual de todos los productos con control de inventario. Podés contar los productos mientras el restaurante sigue operando.
        </p>
        <Input
          label="Notas (opcional)"
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
          placeholder="Ej: Inventario mensual julio"
        />
        <Button onClick={onCrear} loading={loading} className="w-full">
          Iniciar sesión
        </Button>
      </div>
    </SidePanel>
  )
}

function ConteoView({
  sesion, view, setView, onVolver, searchProducto, setSearchProducto,
  conteoForm, setConteoForm, productosFiltrados, unidades,
  registrarMutation, eliminarMutation, cerrarMutation, cancelarMutation,
  deleteConfirm, setDeleteConfirm, cancelConfirmOpen, setCancelConfirmOpen,
}: {
  sesion: SesionDetalle
  view: 'conteo' | 'conciliacion'
  setView: (v: 'conteo' | 'conciliacion' | 'detalle' | 'lista') => void
  onVolver: () => void
  searchProducto: string
  setSearchProducto: (v: string) => void
  conteoForm: { producto_id: string; stock_fisico: string; unidad_medida_id: string }
  setConteoForm: (f: { producto_id: string; stock_fisico: string; unidad_medida_id: string }) => void
  productosFiltrados: { id: string; nombre: string; stock_actual: number; unidad_medida_id?: string; stock_minimo: number }[]
  unidades: { id: string; nombre: string; abreviatura: string }[]
  registrarMutation: { mutate: () => void; isPending: boolean }
  eliminarMutation: { mutate: (v: { sesionId: string; productoId: string }) => void; isPending: boolean }
  cerrarMutation: { mutate: (v: { producto_id: string; aplicar: boolean }[]) => void; isPending: boolean }
  cancelarMutation: { mutate: () => void; isPending: boolean }
  deleteConfirm: { sesionId: string; productoId: string; nombre: string } | null
  setDeleteConfirm: (d: { sesionId: string; productoId: string; nombre: string } | null) => void
  cancelConfirmOpen: boolean
  setCancelConfirmOpen: (v: boolean) => void
}) {
  const conteos = sesion.conteos ?? []
  const totalProductos = sesion.resumen?.total_productos ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onVolver} className="size-8 flex items-center justify-center rounded-lg hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-[10px] capitalize">Abierta</Badge>
            {sesion.sucursal_nombre && (
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Building2 className="size-3" /> {sesion.sucursal_nombre}
              </span>
            )}
          </div>
          {sesion.notas && <p className="text-xs text-text-secondary mt-0.5">{sesion.notas}</p>}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setCancelConfirmOpen(true)}>
          Cancelar sesión
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Columna izquierda: búsqueda y formulario */}
        <div className="flex-[3] flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
            <input
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto flex-1">
            {productosFiltrados.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setConteoForm({
                    producto_id: p.id,
                    stock_fisico: '',
                    unidad_medida_id: p.unidad_medida_id ?? '',
                  })
                  setSearchProducto('')
                }}
                className={cn(
                  'bg-white border rounded-xl p-3 cursor-pointer transition-all hover:border-accent hover:shadow-sm',
                  conteoForm.producto_id === p.id ? 'border-accent ring-1 ring-accent/20' : 'border-border',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-text-primary">{p.nombre}</span>
                    <p className="text-xs text-text-secondary">
                      Stock en sistema: <span className="font-mono font-medium text-text-primary">{p.stock_actual}</span>
                    </p>
                  </div>
                  <ArrowLeft className="size-4 text-text-secondary rotate-180" />
                </div>

                {conteoForm.producto_id === p.id && (
                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={conteoForm.stock_fisico}
                      onChange={(e) => setConteoForm({ ...conteoForm, stock_fisico: e.target.value })}
                      placeholder="Cantidad contada"
                      className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      autoFocus
                    />
                    {p.unidad_medida_id && (
                      <Select
                        value={conteoForm.unidad_medida_id}
                        onValueChange={(v) => setConteoForm({ ...conteoForm, unidad_medida_id: v })}
                        options={unidades.map((u) => ({ value: u.id, label: u.abreviatura || u.nombre }))}
                      />
                    )}
                    <Button
                      size="sm"
                      onClick={() => registrarMutation.mutate()}
                      loading={registrarMutation.isPending}
                      disabled={!conteoForm.stock_fisico}
                    >
                      Registrar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha: productos contados */}
        <div className="flex-[2] flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              {conteos.length} de {totalProductos} contados
            </span>
            <div className="flex-1 mx-3 bg-bg-surface rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-accent h-1.5 rounded-full transition-all"
                style={{ width: `${totalProductos > 0 ? (conteos.length / totalProductos) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
            {conteos.map((c) => (
              <div key={c.producto_id} className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2 text-xs">
                <span className="flex-1 font-medium truncate">{c.producto_nombre}</span>
                <span className="font-mono text-text-primary tabular-nums">{c.stock_sistema}</span>
                <span className="text-text-secondary">→</span>
                <span className="font-mono font-semibold tabular-nums">{c.stock_fisico}</span>
                <span className={cn(
                  'font-mono tabular-nums',
                  c.diferencia > 0 ? 'text-success' : c.diferencia < 0 ? 'text-danger' : 'text-text-secondary',
                )}>
                  {c.diferencia > 0 ? '+' : ''}{c.diferencia.toFixed(2)}
                </span>
                {c.hubo_movimientos && (
                  <AlertTriangle className="size-3 text-warning shrink-0" />
                )}
                <button
                  onClick={() => setDeleteConfirm({ sesionId: sesion.id, productoId: c.producto_id, nombre: c.producto_nombre })}
                  className="text-text-secondary hover:text-danger transition-colors shrink-0"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>

          {conteos.length > 0 && (
            <Button
              className="w-full mt-2"
              onClick={() => setView('conciliacion')}
            >
              Cerrar y conciliar
            </Button>
          )}
        </div>
      </div>

      {/* Conciliación panel */}
      {view === 'conciliacion' && (
        <ConciliacionPanel
          sesion={sesion}
          onCerrar={cerrarMutation.mutate}
          onCancel={() => setView('conteo')}
          loading={cerrarMutation.isPending}
        />
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={() => cancelarMutation.mutate()}
        title="Cancelar sesión de inventario"
        message="¿Estás seguro de cancelar esta sesión? Los conteos registrados se conservarán pero no se generarán ajustes."
        confirmLabel="Sí, cancelar sesión"
        loading={cancelarMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && eliminarMutation.mutate({ sesionId: deleteConfirm.sesionId, productoId: deleteConfirm.productoId })}
        title="Eliminar conteo"
        message={deleteConfirm ? `¿Eliminar el conteo de "${deleteConfirm.nombre}"?` : ''}
        confirmLabel="Eliminar"
        loading={eliminarMutation.isPending}
      />
    </div>
  )
}

function ConciliacionPanel({
  sesion, onCerrar, onCancel, loading,
}: {
  sesion: SesionDetalle
  onCerrar: (lineas: { producto_id: string; aplicar: boolean }[]) => void
  onCancel: () => void
  loading: boolean
}) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const t: Record<string, boolean> = {}
    for (const c of sesion.conteos) {
      t[c.producto_id] = c.diferencia !== 0
    }
    return t
  })

  const conteos = sesion.conteos ?? []
  const aplicarCount = Object.values(toggles).filter(Boolean).length
  const ajusteNeto = conteos
    .filter(c => toggles[c.producto_id])
    .reduce((sum, c) => sum + c.diferencia, 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <span className="font-semibold text-lg text-text-primary">Conciliación de inventario</span>
            <p className="text-xs text-text-secondary mt-0.5">
              Revisá cada diferencia y decidí si aplicás el ajuste o lo ignorás.
            </p>
          </div>
          <button onClick={onCancel} className="text-text-secondary hover:text-text-primary text-lg">&times;</button>
        </div>

        <div className="flex gap-3 px-6 py-3 border-b border-border bg-bg-surface/50">
          <div className="text-center">
            <div className="text-xs text-text-secondary">A aplicar</div>
            <div className="font-bold text-sm text-accent">{aplicarCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-secondary">Ignorar</div>
            <div className="font-bold text-sm text-text-secondary">{conteos.length - aplicarCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-secondary">Ajuste neto</div>
            <div className={cn('font-bold text-sm', ajusteNeto > 0 ? 'text-success' : ajusteNeto < 0 ? 'text-danger' : 'text-text-secondary')}>
              {ajusteNeto > 0 ? '+' : ''}{ajusteNeto.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="text-left py-2 font-medium">Producto</th>
                <th className="text-right py-2 font-medium">Stock sistema</th>
                <th className="text-right py-2 font-medium">Stock contado</th>
                <th className="text-right py-2 font-medium">Diferencia</th>
                <th className="text-center py-2 font-medium w-1">Aplicar</th>
              </tr>
            </thead>
            <tbody>
              {conteos.map((c) => (
                <tr key={c.producto_id} className="border-b border-border/50">
                  <td className="py-2">
                    <span className="font-medium text-text-primary">{c.producto_nombre}</span>
                    {c.hubo_movimientos && (
                      <Badge variant="warning" className="text-[10px] ml-2">
                        <AlertTriangle className="size-2.5 mr-0.5" />
                        Tuvo movimientos
                      </Badge>
                    )}
                  </td>
                  <td className="py-2 text-right font-mono text-text-primary">{c.stock_sistema}</td>
                  <td className="py-2 text-right font-mono text-text-primary">{c.stock_fisico}</td>
                  <td className={cn(
                    'py-2 text-right font-mono',
                    c.diferencia > 0 ? 'text-success' : c.diferencia < 0 ? 'text-danger' : 'text-text-secondary',
                  )}>
                    {c.diferencia > 0 ? '+' : ''}{c.diferencia.toFixed(2)}
                  </td>
                  <td className="py-2 text-center">
                    <button
                      onClick={() => setToggles({ ...toggles, [c.producto_id]: !toggles[c.producto_id] })}
                      className={cn(
                        'px-3 py-1 rounded-lg text-[11px] font-medium transition-all',
                        toggles[c.producto_id]
                          ? 'bg-success/10 text-success border border-success/30'
                          : 'bg-bg-surface text-text-secondary border border-border',
                      )}
                    >
                      {toggles[c.producto_id] ? 'Aplicar' : 'Ignorar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Volver al conteo</Button>
          <Button
            onClick={() => {
              const lineas = conteos.map(c => ({
                producto_id: c.producto_id,
                aplicar: toggles[c.producto_id] ?? false,
              }))
              onCerrar(lineas)
            }}
            loading={loading}
          >
            Confirmar cierre ({aplicarCount} ajustes)
          </Button>
        </div>
      </div>
    </div>
  )
}

function DetalleSesionView({
  sesion, onVolver,
}: {
  sesion: SesionDetalle
  onVolver: () => void
}) {
  const conteos = sesion.conteos ?? []

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onVolver} className="size-8 flex items-center justify-center rounded-lg hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={sesion.estado === 'cerrada' ? 'default' : 'danger'} className="text-[10px] capitalize">
              {sesion.estado}
            </Badge>
            {sesion.sucursal_nombre && (
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Building2 className="size-3" /> {sesion.sucursal_nombre}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Creada {new Date(sesion.creado_en).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {sesion.cerrado_en && ` · Cerrada ${new Date(sesion.cerrado_en).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
          </p>
          {sesion.notas && <p className="text-xs text-text-secondary">{sesion.notas}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-xs font-medium text-text-secondary">
          {conteos.length} productos contados
          {sesion.estado === 'cerrada' && (
            <span className="ml-2">
              · {conteos.filter(c => c.aplicado).length} ajustes aplicados
              · {conteos.filter(c => c.ignorado).length} ignorados
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {conteos.map((c) => (
            <div key={c.producto_id} className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2 text-xs">
              <span className="flex-1 font-medium truncate">{c.producto_nombre}</span>
              <span className="font-mono text-text-primary">{c.stock_sistema}</span>
              <span className="text-text-secondary">→</span>
              <span className="font-mono font-semibold">{c.stock_fisico}</span>
              <span className={cn(
                'font-mono',
                c.diferencia > 0 ? 'text-success' : c.diferencia < 0 ? 'text-danger' : 'text-text-secondary',
              )}>
                {c.diferencia > 0 ? '+' : ''}{c.diferencia.toFixed(2)}
              </span>
              {sesion.estado === 'cerrada' && (
                <Badge variant={c.aplicado ? 'success' : 'default'} className="text-[10px]">
                  {c.aplicado ? 'Aplicado' : 'Ignorado'}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
