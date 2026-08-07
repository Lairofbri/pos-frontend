import { useState } from 'react'
import { Package, TriangleAlert, TrendingDown, Plus, Calendar, CheckCircle, BookOpen, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { obtenerResumen, listarMovimientos, crearMovimiento, revertirMovimiento, reconciliarStock, listarUnidades, obtenerKardex } from './api'
import type { KardexMovimiento } from './api'
import { listarProductos, crearProducto, actualizarProducto } from '../productos/api'
import { listarCategorias } from '../../../api/categorias'
import { CategoryNavigator } from '../../../components/shared/CategoryNavigator'
import { CategoryPanel } from '../../../components/shared/CategoryPanel'
import { cn } from '@/lib/utils'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '../../../components/shared/PageHeader'
import { Icon } from '../../../components/shared/Icon'
import { useToastStore } from '../../../store/toastStore'
import SesionesTab from './SesionesTab'
import type { Producto } from '../../../types'

const badgeVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  compra: 'success',
  devolucion: 'info',
  ajuste: 'warning',
  merma: 'danger',
  consumo: 'default',
}

const tipoLabels: Record<string, string> = {
  compra: 'Compra',
  devolucion: 'Devolución',
  ajuste: 'Ajuste',
  merma: 'Merma',
  consumo: 'Consumo',
}

const TIPOS_FILTRO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'compra', label: 'Compra' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'merma', label: 'Merma' },
  { value: 'devolucion', label: 'Devolución' },
  { value: 'consumo', label: 'Consumo' },
]

const TIPOS_REGISTRO = [
  { value: 'compra', label: 'Compra' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'merma', label: 'Merma' },
  { value: 'devolucion', label: 'Devolución' },
]

export default function InventarioPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  const [catPanelOpen, setCatPanelOpen] = useState(false)
  const [view, setView] = useState<'resumen' | 'items' | 'movimientos' | 'sesiones'>('resumen')
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)

  const [movPanelOpen, setMovPanelOpen] = useState(false)
  const [itemPanelOpen, setItemPanelOpen] = useState(false)
  const [editandoItem, setEditandoItem] = useState<Producto | null>(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [pagina, setPagina] = useState(1)

  const [movForm, setMovForm] = useState({
    producto_id: '',
    tipo: 'compra' as 'compra' | 'ajuste' | 'merma' | 'devolucion',
    cantidad: '',
    unidad_medida_id: '',
    costo_unitario: '',
    motivo: '',
  })

  const [itemForm, setItemForm] = useState({
    nombre: '',
    categoria_id: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida_id: '',
    precio_costo: '',
  })

  const { data: unidades } = useQuery({
    queryKey: ['unidades-medida'],
    queryFn: listarUnidades,
    ...queryDefaults('unidades-medida'),
  })

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => listarCategorias(),
    ...queryDefaults('categorias'),
  })

  const { data: resumen } = useQuery({
    queryKey: ['inventario-resumen'],
    queryFn: obtenerResumen,
    ...queryDefaults('inventario-resumen'),
  })

  const { data: productosStock, isLoading: prodLoading } = useQuery({
    queryKey: ['productos-stock', categoriaActiva],
    queryFn: () => listarProductos({ tiene_stock: true, categoria_id: categoriaActiva ?? undefined }),
    ...queryDefaults('productos-stock'),
  })

  const { data: listado, isLoading: lLoading, error, refetch } = useQuery({
    queryKey: ['inventario-movimientos', filtroTipo, pagina],
    queryFn: () => listarMovimientos({ tipo: filtroTipo || undefined, pagina, limite: 20 }),
    ...queryDefaults('inventario-movimientos'),
  })

  const [showReconciliar, setShowReconciliar] = useState(false)
  const [kardexProducto, setKardexProducto] = useState<Producto | null>(null)
  const [kardexPagina, setKardexPagina] = useState(1)

  const { data: kardexData, isLoading: kardexLoading } = useQuery({
    queryKey: ['kardex', kardexProducto?.id, kardexPagina],
    queryFn: () => kardexProducto ? obtenerKardex(kardexProducto.id, { pagina: kardexPagina, limite: 30 }) : Promise.resolve(null),
    enabled: !!kardexProducto,
    ...queryDefaults('kardex'),
  })

  const reconciliarQuery = useQuery({
    queryKey: ['inventario-reconciliar'],
    queryFn: reconciliarStock,
    enabled: false,
    ...queryDefaults('inventario-reconciliar'),
  })

  const crearMovMutation = useMutation({
      mutationFn: () => crearMovimiento({
        producto_id: movForm.producto_id,
        tipo: movForm.tipo,
        cantidad: parseFloat(movForm.cantidad),
        unidad_medida_id: movForm.unidad_medida_id || undefined,
        motivo: movForm.motivo || undefined,
        costo_unitario: movForm.costo_unitario ? parseFloat(movForm.costo_unitario) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-resumen'] })
      queryClient.invalidateQueries({ queryKey: ['inventario-movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-stock'] })
      setMovPanelOpen(false)
      setMovForm({ producto_id: '', tipo: 'compra', cantidad: '', unidad_medida_id: '', costo_unitario: '', motivo: '' })
      showToast({ type: 'success', message: 'Movimiento registrado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al registrar movimiento' }),
  })

  const revertirMutation = useMutation({
    mutationFn: (id: string) => revertirMovimiento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-resumen'] })
      queryClient.invalidateQueries({ queryKey: ['inventario-movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-stock'] })
      showToast({ type: 'success', message: 'Movimiento revertido' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al revertir movimiento' }),
  })

  const crearItemMutation = useMutation({
    mutationFn: () => crearProducto({
      nombre: itemForm.nombre,
      categoria_id: itemForm.categoria_id || undefined,
      tiene_stock: true,
      se_vende: false,
      tiene_receta: false,
      stock_actual: parseFloat(itemForm.stock_actual || '0'),
      stock_minimo: parseFloat(itemForm.stock_minimo || '0'),
      unidad_medida_id: itemForm.unidad_medida_id || undefined,
      precio_costo: parseFloat(itemForm.precio_costo || '0'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-stock'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      cerrarItemPanel()
      showToast({ type: 'success', message: 'Insumo creado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al crear insumo' }),
  })

  const editarItemMutation = useMutation({
    mutationFn: () => editandoItem
      ? actualizarProducto(editandoItem.id, {
          nombre: itemForm.nombre,
          categoria_id: itemForm.categoria_id || undefined,
          stock_minimo: parseFloat(itemForm.stock_minimo || '0'),
          unidad_medida_id: itemForm.unidad_medida_id || undefined,
          precio_costo: parseFloat(itemForm.precio_costo || '0'),
        })
      : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-stock'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      cerrarItemPanel()
      showToast({ type: 'success', message: 'Insumo actualizado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al actualizar insumo' }),
  })

  const abrirNuevoItem = () => {
    setEditandoItem(null)
    setItemForm({ nombre: '', categoria_id: categoriaActiva ?? '', stock_actual: '', stock_minimo: '', unidad_medida_id: '', precio_costo: '' })
    setItemPanelOpen(true)
  }

  const abrirEditarItem = (p: Producto) => {
    setEditandoItem(p)
    setItemForm({
      nombre: p.nombre,
      categoria_id: p.categoria_id ?? '',
      stock_actual: String(p.stock_actual),
      stock_minimo: String(p.stock_minimo),
      unidad_medida_id: p.unidad_medida_id ?? '',
      precio_costo: String(p.precio_costo ?? 0),
    })
    setItemPanelOpen(true)
  }

  const cerrarItemPanel = () => {
    setItemPanelOpen(false)
    setEditandoItem(null)
  }

  const abrirMovimiento = (producto?: Producto) => {
    const defaultUnidad = unidades?.find(u => u.categoria === 'unidad') ?? unidades?.[0]
    setMovForm({
      producto_id: producto?.id ?? '',
      tipo: 'compra',
      cantidad: '',
      unidad_medida_id: producto?.unidad_medida_id ?? defaultUnidad?.id ?? '',
      costo_unitario: '',
      motivo: '',
    })
    setMovPanelOpen(true)
  }

  const cards = [
    { icon: Package, label: 'Productos con stock', value: resumen?.productos_con_stock ?? 0, variant: 'default' as const },
    { icon: TriangleAlert, label: 'Alertas activas', value: resumen?.alertas_count ?? 0, variant: (resumen?.alertas_count ?? 0) > 0 ? 'danger' as const : 'default' as const },
    { icon: TrendingDown, label: 'Movimientos hoy', value: resumen?.movimientos_hoy ?? 0, variant: 'info' as const },
    { icon: Package, label: 'Consumido hoy', value: resumen?.consumido_hoy ?? 0, variant: 'warning' as const },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Inventario" subtitle="Control de stock, insumos y movimientos" />

      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-3 animate-fadeInUp ${
                card.variant === 'danger' ? 'ring-1 ring-danger/20' : ''
              }`}
            >
              <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                card.variant === 'danger' ? 'bg-danger/10 text-danger' :
                card.variant === 'warning' ? 'bg-warning/10 text-warning' :
                card.variant === 'info' ? 'bg-info/10 text-info' :
                'bg-accent/10 text-accent'
              }`}>
                <card.icon className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold tabular-nums text-text-primary">{card.value}</span>
                <span className="text-[11px] text-text-secondary truncate">{card.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* View tabs */}
        <div className="flex gap-1 mb-4 bg-bg-surface rounded-xl p-1 border border-border overflow-x-auto">
          {[
            { key: 'items' as const, label: 'Insumos', icon: 'package' },
            { key: 'movimientos' as const, label: 'Movimientos', icon: 'list' },
            { key: 'sesiones' as const, label: 'Sesiones', icon: 'clipboard' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                view === tab.key
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
              }`}
            >
              <Icon name={tab.icon} className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items View */}
        {view === 'items' && (
          <>
            <CategoryNavigator
              module="inventario"
              onSelect={(catId) => setCategoriaActiva(catId)}
              onNewCategory={() => setCatPanelOpen(true)}
              onEditCategory={() => setCatPanelOpen(true)}
            />

            {prodLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                {productosStock?.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => abrirEditarItem(p)}
                    className="bg-white border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-accent hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-sm text-text-primary truncate">{p.nombre}</span>
                      <Badge variant={p.stock_actual <= p.stock_minimo ? 'danger' : 'success'} className="text-[10px]">
                        {p.stock_actual <= p.stock_minimo ? 'Stock bajo' : 'OK'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="font-mono text-sm text-text-primary font-semibold">{p.stock_actual}</span>
                      <span>{p.stock_minimo > 0 ? `/ ${p.stock_minimo} min` : ''}</span>
                    </div>
                    {p.stock_actual <= p.stock_minimo && (
                      <div className="mt-2 w-full bg-danger/10 rounded-full h-1.5">
                        <div className="bg-danger h-1.5 rounded-full" style={{ width: `${Math.min(100, (p.stock_actual / Math.max(1, p.stock_minimo)) * 100)}%` }} />
                      </div>
                    )}
                    <div className="flex gap-1 mt-2">
                      <Badge variant="info" className="text-[10px]">Stock: {p.stock_actual}</Badge>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setKardexProducto(p); setKardexPagina(1) }}
                      className="mt-2 w-full text-[10px] font-medium text-accent hover:text-accent-hover flex items-center justify-center gap-1 py-1 rounded-md hover:bg-accent/5 transition-colors"
                    >
                      <BookOpen className="size-3" /> Kardex
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center mt-4 gap-2">
              <Button size="sm" onClick={abrirNuevoItem}>
                <Plus className="size-4 mr-1" /> Nuevo insumo
              </Button>
            </div>
          </>
        )}

        {/* Movements View */}
        {view === 'movimientos' && (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-4 items-end">
              <Select
                value={filtroTipo}
                onValueChange={(v) => { setFiltroTipo(v); setPagina(1) }}
                options={TIPOS_FILTRO}
              />
              <div className="flex-1" />
              <Button size="sm" variant="ghost" onClick={() => { setShowReconciliar(true); reconciliarQuery.refetch() }} loading={reconciliarQuery.isFetching}>
                Conciliar stock
              </Button>
              <Button size="sm" onClick={() => abrirMovimiento()}>
                <Plus className="size-4 mr-1" /> Registrar movimiento
              </Button>
            </div>

            {showReconciliar && reconciliarQuery.data && (
              <div className={cn(
                'p-4 rounded-xl mb-4',
                reconciliarQuery.data.conciliado ? 'bg-success/10 border border-success/20' : 'bg-warning/10 border border-warning/20',
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    {reconciliarQuery.data.conciliado ? (
                      <><CheckCircle className="size-4 text-success" /> Stock conciliado — sin divergencias</>
                    ) : (
                      <><TriangleAlert className="size-4 text-warning" /> {reconciliarQuery.data.total_divergencias} divergencias encontradas</>
                    )}
                  </span>
                  <button onClick={() => setShowReconciliar(false)} className="text-xs text-text-secondary hover:text-text-primary">Cerrar</button>
                </div>
                {!reconciliarQuery.data.conciliado && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-text-secondary text-left border-b border-border">
                          <th className="pb-1 pr-2">Producto</th>
                          <th className="pb-1 pr-2 text-right">Stock actual</th>
                          <th className="pb-1 pr-2 text-right">Saldo movs.</th>
                          <th className="pb-1 text-right">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconciliarQuery.data.divergencias.map(d => (
                          <tr key={d.id} className="border-b border-border/30">
                            <td className="py-1 pr-2 max-w-[120px] truncate">{d.nombre}</td>
                            <td className="py-1 pr-2 text-right font-mono">{d.stock_actual}</td>
                            <td className="py-1 pr-2 text-right font-mono">{d.saldo_movimientos}</td>
                            <td className={`py-1 text-right font-mono font-semibold ${d.diferencia > 0 ? 'text-success' : 'text-danger'}`}>
                              {d.diferencia > 0 ? '+' : ''}{d.diferencia}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {(listado?.movimientos ?? []).map((m, i) => {
                const d = new Date(m.creado_en)
                const esPositivo = ['compra', 'devolucion'].includes(m.tipo_movimiento)
                const negativo = m.stock_posterior < 0
                return (
                  <div
                    key={m.id}
                    className="bg-white border border-border rounded-xl p-4 transition-all hover:border-accent/30 hover:shadow-sm"
                    style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="size-3.5 text-text-secondary shrink-0" />
                        <span className="text-xs text-text-secondary tabular-nums whitespace-nowrap">
                          {d.toLocaleDateString('es-SV')} {d.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <Badge variant={badgeVariant[m.tipo_movimiento] ?? 'default'} className="text-[10px] shrink-0">
                        {tipoLabels[m.tipo_movimiento] ?? m.tipo_movimiento}
                      </Badge>
                      {m.movimiento_revertido_id && (
                        <Badge variant="warning" className="text-[10px] shrink-0">Revertido</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-text-primary truncate mb-3">{m.producto_nombre}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-lg ${esPositivo ? 'text-success' : 'text-danger'}`}>
                          {esPositivo ? '+' : '-'}{m.cantidad} {m.unidad_abrev ?? ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono text-sm font-semibold ${negativo ? 'text-danger' : 'text-text-primary'}`}>
                          {m.stock_posterior}
                        </span>
                        <span className="text-[10px] text-text-secondary ml-1">stock</span>
                      </div>
                    </div>
                    {['compra', 'devolucion', 'merma'].includes(m.tipo_movimiento) && !m.movimiento_revertido_id && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <button
                          onClick={() => { if (confirm('¿Revertir este movimiento?')) revertirMutation.mutate(m.id) }}
                          disabled={revertirMutation.isPending}
                          className="text-[10px] text-accent hover:text-accent-hover font-semibold disabled:opacity-50"
                        >
                          Revertir
                        </button>
                      </div>
                    )}
                    {(m.motivo || m.creado_por_nombre) && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                        {m.motivo ? (
                          <span className="text-xs text-text-secondary truncate max-w-[70%]">{m.motivo}</span>
                        ) : <span />}
                        {m.creado_por_nombre && (
                          <span className="text-[10px] text-text-secondary">{m.creado_por_nombre}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {listado && listado.movimientos && listado.movimientos.length > 0 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" variant="ghost" disabled={pagina <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))}>Anterior</Button>
                <span className="text-xs text-text-secondary self-center">Pág {pagina}</span>
                <Button size="sm" variant="ghost" disabled={(listado?.movimientos ?? []).length < 20} onClick={() => setPagina(p => p + 1)}>Siguiente</Button>
              </div>
            )}

            {lLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
            {error && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Icon name="alert" className="size-8 text-danger" />
                <p className="text-danger text-sm">Error al cargar movimientos</p>
                <Button size="sm" onClick={() => refetch()}>Reintentar</Button>
              </div>
            )}
            {!lLoading && !error && (listado?.movimientos ?? []).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-1 text-text-secondary mt-4">
                <Package className="size-8 mb-1" />
                <span className="font-semibold text-sm text-text-primary">Sin movimientos</span>
                <span className="text-xs">Registra el primer movimiento</span>
              </div>
            )}
          </>
        )}

        {/* Sesiones View */}
        {view === 'sesiones' && <SesionesTab />}
      </div>

      {/* Category Panel */}
      <CategoryPanel open={catPanelOpen} onClose={() => setCatPanelOpen(false)} module="inventario" />

      {/* Item SidePanel */}
      <SidePanel
        open={itemPanelOpen}
        onClose={cerrarItemPanel}
        title={editandoItem ? 'Editar insumo' : 'Nuevo insumo'}
      >
        <div className="flex flex-col gap-4 p-4">
          <Input label="Nombre" value={itemForm.nombre} onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })} required />
          <Select label="Categoría" value={itemForm.categoria_id} onValueChange={(v) => setItemForm({ ...itemForm, categoria_id: v })}
            options={[{ value: '', label: 'Sin categoría' }, ...(categoriasData?.filter(c => c.activo !== false).map((c) => ({ value: c.id, label: c.nombre })) ?? [])]} />
          <Input label="Stock inicial" type="number" step="0.01" min="0" value={itemForm.stock_actual} onChange={(e) => setItemForm({ ...itemForm, stock_actual: e.target.value })} disabled={!!editandoItem} />
          <Input label="Stock mínimo" type="number" step="0.01" min="0" value={itemForm.stock_minimo} onChange={(e) => setItemForm({ ...itemForm, stock_minimo: e.target.value })} />
          <Input label="Costo ($)" type="number" step="0.01" min="0" value={itemForm.precio_costo} onChange={(e) => setItemForm({ ...itemForm, precio_costo: e.target.value })} placeholder="Ej: 2.50" />
          <Select label="Unidad de medida" value={itemForm.unidad_medida_id} onValueChange={(v) => setItemForm({ ...itemForm, unidad_medida_id: v })}
            options={[{ value: '', label: 'Seleccionar unidad...' }, ...(unidades?.map((u) => ({ value: u.id, label: `${u.nombre} (${u.abreviatura})` })) ?? [])]} />
          <Button onClick={() => editandoItem ? editarItemMutation.mutate() : crearItemMutation.mutate()} loading={crearItemMutation.isPending || editarItemMutation.isPending} disabled={!itemForm.nombre} className="w-full">
            {editandoItem ? 'Guardar cambios' : 'Crear insumo'}
          </Button>
        </div>
      </SidePanel>

      {/* Movement SidePanel */}
      <SidePanel
        open={movPanelOpen}
        onClose={() => { setMovPanelOpen(false); setMovForm({ producto_id: '', tipo: 'compra', cantidad: '', unidad_medida_id: '', costo_unitario: '', motivo: '' }) }}
        title="Registrar movimiento"
      >
        <div className="flex flex-col gap-4 p-4">
          <Select label="Producto" value={movForm.producto_id} onValueChange={(v) => setMovForm({ ...movForm, producto_id: v })}
            options={[{ value: '', label: 'Seleccionar producto...' }, ...(productosStock?.map((p) => ({ value: p.id, label: `${p.nombre} (stock: ${p.stock_actual})` })) ?? [])]} />
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Tipo de movimiento</label>
            <div className="flex gap-2 flex-wrap">
              {TIPOS_REGISTRO.map((t) => (
                <button key={t.value} onClick={() => setMovForm({ ...movForm, tipo: t.value as typeof movForm.tipo })}
                  className={`flex-1 min-w-[60px] px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${movForm.tipo === t.value ? 'bg-accent text-white border-accent font-semibold' : 'bg-bg-surface text-text-secondary border-border hover:border-accent/40'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Input label="Cantidad" type="number" step="0.01" min="0.01" value={movForm.cantidad} onChange={(e) => setMovForm({ ...movForm, cantidad: e.target.value })} placeholder="Ej: 10" required />
          {movForm.tipo === 'compra' && (
            <Input label="Costo unitario ($)" type="number" step="0.01" min="0" value={movForm.costo_unitario} onChange={(e) => setMovForm({ ...movForm, costo_unitario: e.target.value })} placeholder="Ej: 2.50" />
          )}
          <Select label="Unidad de medida" value={movForm.unidad_medida_id} onValueChange={(v) => setMovForm({ ...movForm, unidad_medida_id: v })}
            options={[{ value: '', label: 'Seleccionar unidad...' }, ...(unidades?.map((u) => ({ value: u.id, label: `${u.nombre} (${u.abreviatura})` })) ?? [])]} />
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Motivo (opcional)</label>
            <textarea value={movForm.motivo} onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })} placeholder="Ej: Reposición de inventario"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
          </div>
          {crearMovMutation.isError && <p className="text-xs text-danger text-center">Error al registrar movimiento</p>}
          <Button onClick={() => crearMovMutation.mutate()} loading={crearMovMutation.isPending} disabled={!movForm.producto_id || !movForm.cantidad || parseFloat(movForm.cantidad) < 0.01} className="w-full">
            Registrar
          </Button>
        </div>
      </SidePanel>

      {/* Kardex SidePanel */}
      <SidePanel
        open={!!kardexProducto}
        onClose={() => setKardexProducto(null)}
        title={`Kardex — ${kardexProducto?.nombre ?? ''}`}
        className="max-w-2xl"
      >
        {kardexLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : kardexData ? (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border bg-bg-surface/50">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">Stock actual</span>
                  <span className="text-sm font-mono font-semibold text-text-primary">{kardexData.producto.stock_actual} {kardexData.producto.unidad}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">Costo promedio</span>
                  <span className="text-sm font-mono font-semibold text-accent">${kardexData.producto.costo_promedio.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">Total movimientos</span>
                  <span className="text-sm font-mono font-semibold text-text-primary">{kardexData.paginacion.total}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-secondary text-left border-b border-border sticky top-0 bg-bg-surface">
                    <th className="pb-2 pr-2 font-medium w-[120px]">Fecha</th>
                    <th className="pb-2 pr-2 font-medium w-[70px]">Tipo</th>
                    <th className="pb-2 pr-2 font-medium text-right w-[60px]">Cant.</th>
                    <th className="pb-2 pr-2 font-medium text-right w-[70px]">Costo Un.</th>
                    <th className="pb-2 pr-2 font-medium text-right w-[70px]">Costo Tot.</th>
                    <th className="pb-2 font-medium text-right w-[60px]">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {kardexData.movimientos.map((m: KardexMovimiento) => {
                    const d = new Date(m.fecha)
                    const esEntrada = ['Compra', 'Ajuste', 'Devolución'].includes(m.tipo)
                    const esSalida = ['Merma', 'Consumo'].includes(m.tipo)
                    return (
                      <tr key={m.id} className={`border-b border-border/30 ${m.revertido ? 'opacity-50' : ''}`}>
                        <td className="py-1.5 pr-2 whitespace-nowrap text-text-secondary">
                          {d.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="py-1.5 pr-2">
                          <span className={`inline-flex items-center gap-0.5 ${
                            esEntrada ? 'text-success' : esSalida ? 'text-danger' : 'text-text-secondary'
                          }`}>
                            {esEntrada ? <ArrowUpRight className="size-3" /> : esSalida ? <ArrowDownRight className="size-3" /> : <Minus className="size-3" />}
                            {m.tipo}
                          </span>
                        </td>
                        <td className={`py-1.5 pr-2 text-right font-mono font-medium ${
                          esEntrada ? 'text-success' : esSalida ? 'text-danger' : 'text-text-primary'
                        }`}>
                          {esEntrada ? '+' : '-'}{m.cantidad}
                        </td>
                        <td className="py-1.5 pr-2 text-right font-mono text-text-secondary">
                          {m.costo_unitario != null ? `$${m.costo_unitario.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-1.5 pr-2 text-right font-mono text-text-secondary">
                          {m.costo_total != null ? `$${m.costo_total.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-1.5 text-right font-mono text-text-primary">
                          <span className={`${m.stock_posterior < 0 ? 'text-danger' : ''}`}>
                            {m.stock_posterior}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {kardexData.paginacion.paginas > 1 && (
              <div className="flex justify-center gap-2 p-3 border-t border-border">
                <Button size="sm" variant="ghost" disabled={kardexPagina <= 1} onClick={() => setKardexPagina(p => Math.max(1, p - 1))}>Anterior</Button>
                <span className="text-xs text-text-secondary self-center">Pág {kardexPagina} / {kardexData.paginacion.paginas}</span>
                <Button size="sm" variant="ghost" disabled={kardexPagina >= kardexData.paginacion.paginas} onClick={() => setKardexPagina(p => p + 1)}>Siguiente</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-1 text-text-secondary">
            <BookOpen className="size-8 mb-1" />
            <span className="text-sm">Sin datos</span>
          </div>
        )}
      </SidePanel>
    </div>
  )
}
