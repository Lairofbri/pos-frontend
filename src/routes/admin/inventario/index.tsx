import { useState, useEffect } from 'react'
import { Package, TriangleAlert, TrendingDown, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { obtenerResumen, listarMovimientos, crearMovimiento, listarUnidades } from './api'
import type { MovimientoInventario } from './api'
import { listarProductos, crearProducto, actualizarProducto } from '../productos/api'
import { CategoryNavigator } from '../../../components/shared/CategoryNavigator'
import { CategoryPanel } from '../../../components/shared/CategoryPanel'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '../../../components/shared/PageHeader'
import { Icon } from '../../../components/shared/Icon'
import { useToastStore } from '../../../store/toastStore'
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

const columns: Column<MovimientoInventario>[] = [
  {
    key: 'creado_en',
    header: 'Fecha',
    sortable: true,
    width: '140px',
    render: (m) => {
      const d = new Date(m.creado_en)
      return <span className="text-xs tabular-nums whitespace-nowrap">{d.toLocaleDateString('es-SV')} {d.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}</span>
    },
  },
  { key: 'producto_nombre', header: 'Producto', sortable: true },
  {
    key: 'tipo_movimiento',
    header: 'Tipo',
    render: (m) => <Badge variant={badgeVariant[m.tipo_movimiento] ?? 'default'}>{tipoLabels[m.tipo_movimiento] ?? m.tipo_movimiento}</Badge>,
  },
  {
    key: 'cantidad',
    header: 'Cantidad',
    width: '100px',
    render: (m) => {
      const esPositivo = ['compra', 'devolucion'].includes(m.tipo_movimiento)
      return (
        <span className={`font-mono tabular-nums text-sm ${esPositivo ? 'text-success' : 'text-danger'}`}>
          {esPositivo ? '+' : '-'}{m.cantidad} {m.unidad_abrev ?? ''}
        </span>
      )
    },
  },
  {
    key: 'stock_posterior',
    header: 'Stock',
    width: '80px',
    render: (m) => {
      const negativo = m.stock_posterior < 0
      return (
        <span className={`font-mono tabular-nums text-sm ${negativo ? 'text-danger' : 'text-text-primary'}`}>
          {m.stock_posterior}
          {negativo && <Badge variant="danger" className="ml-1">!</Badge>}
        </span>
      )
    },
  },
  {
    key: 'motivo',
    header: 'Motivo',
    render: (m) => <span className="text-xs text-text-secondary truncate max-w-[120px] block">{m.motivo ?? '—'}</span>,
  },
  {
    key: 'creado_por_nombre',
    header: 'Usuario',
    render: (m) => <span className="text-xs text-text-secondary">{m.creado_por_nombre ?? '—'}</span>,
  },
]

export default function InventarioPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  const [catPanelOpen, setCatPanelOpen] = useState(false)
  const [view, setView] = useState<'resumen' | 'items' | 'movimientos'>('resumen')
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
    motivo: '',
  })

  const [itemForm, setItemForm] = useState({
    nombre: '',
    categoria_id: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida_id: '',
  })

  const { data: unidades } = useQuery({
    queryKey: ['unidades-medida'],
    queryFn: listarUnidades,
    ...queryDefaults('unidades-medida'),
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

  const crearMovMutation = useMutation({
    mutationFn: () => crearMovimiento({
      producto_id: movForm.producto_id,
      tipo: movForm.tipo,
      cantidad: parseFloat(movForm.cantidad),
      unidad_medida_id: movForm.unidad_medida_id || undefined,
      motivo: movForm.motivo || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-resumen'] })
      queryClient.invalidateQueries({ queryKey: ['inventario-movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-stock'] })
      setMovPanelOpen(false)
      setMovForm({ producto_id: '', tipo: 'compra', cantidad: '', unidad_medida_id: '', motivo: '' })
      showToast({ type: 'success', message: 'Movimiento registrado' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al registrar movimiento' }),
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
    setItemForm({ nombre: '', categoria_id: categoriaActiva ?? '', stock_actual: '', stock_minimo: '', unidad_medida_id: '' })
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
    })
    setItemPanelOpen(true)
  }

  const cerrarItemPanel = () => {
    setItemPanelOpen(false)
    setEditandoItem(null)
  }

  const abrirMovimiento = (producto?: Producto) => {
    setMovForm({
      producto_id: producto?.id ?? '',
      tipo: 'compra',
      cantidad: '',
      unidad_medida_id: producto?.unidad_medida_id ?? '',
      motivo: '',
    })
    setMovPanelOpen(true)
  }

  useEffect(() => {
    if (unidades?.length && !movForm.unidad_medida_id) {
      const defaultUnidad = unidades.find(u => u.categoria === 'unidad') ?? unidades[0]
      if (defaultUnidad) {
        setMovForm(prev => ({ ...prev, unidad_medida_id: defaultUnidad.id }))
      }
    }
  }, [unidades])

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
              <Button size="sm" onClick={() => abrirMovimiento()}>
                <Plus className="size-4 mr-1" /> Registrar movimiento
              </Button>
            </div>

            <div className="overflow-x-auto">
              <DataTable
                data={listado?.movimientos ?? []}
                columns={columns}
                isLoading={lLoading}
                error={error as Error | null}
                onRetry={() => refetch()}
                keyExtractor={(m) => m.id}
              />
            </div>
          </>
        )}
      </div>

      {/* Category Panel */}
      <CategoryPanel open={catPanelOpen} onClose={() => setCatPanelOpen(false)} />

      {/* Item Panel */}
      <SidePanel
        open={itemPanelOpen}
        onClose={cerrarItemPanel}
        title={editandoItem ? 'Editar insumo' : 'Nuevo insumo'}
      >
        <div className="flex flex-col gap-4 p-4">
          <Input
            label="Nombre"
            value={itemForm.nombre}
            onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })}
            required
          />
          <Input
            label="Stock inicial"
            type="number"
            step="0.01"
            min="0"
            value={itemForm.stock_actual}
            onChange={(e) => setItemForm({ ...itemForm, stock_actual: e.target.value })}
            disabled={!!editandoItem}
          />
          <Input
            label="Stock mínimo"
            type="number"
            step="0.01"
            min="0"
            value={itemForm.stock_minimo}
            onChange={(e) => setItemForm({ ...itemForm, stock_minimo: e.target.value })}
          />
          <Select
            label="Unidad de medida"
            value={itemForm.unidad_medida_id}
            onValueChange={(v) => setItemForm({ ...itemForm, unidad_medida_id: v })}
            options={[
              { value: '', label: 'Seleccionar unidad...' },
              ...(unidades?.map((u) => ({ value: u.id, label: `${u.nombre} (${u.abreviatura})` })) ?? []),
            ]}
          />
          <Button
            onClick={() => editandoItem ? editarItemMutation.mutate() : crearItemMutation.mutate()}
            loading={crearItemMutation.isPending || editarItemMutation.isPending}
            disabled={!itemForm.nombre}
            className="w-full"
          >
            {editandoItem ? 'Guardar cambios' : 'Crear insumo'}
          </Button>
        </div>
      </SidePanel>

      {/* Movement Panel */}
      <SidePanel
        open={movPanelOpen}
        onClose={() => { setMovPanelOpen(false); setMovForm({ producto_id: '', tipo: 'compra', cantidad: '', unidad_medida_id: '', motivo: '' }) }}
        title="Registrar movimiento"
      >
        <div className="flex flex-col gap-4 p-4">
          <Select
            label="Producto"
            value={movForm.producto_id}
            onValueChange={(v) => setMovForm({ ...movForm, producto_id: v })}
            options={[
              { value: '', label: 'Seleccionar producto...' },
              ...(productosStock?.map((p) => ({
                value: p.id,
                label: `${p.nombre} (stock: ${p.stock_actual})`,
              })) ?? []),
            ]}
          />

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Tipo de movimiento</label>
            <div className="flex gap-2 flex-wrap">
              {TIPOS_REGISTRO.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setMovForm({ ...movForm, tipo: t.value as typeof movForm.tipo })}
                  className={`flex-1 min-w-[60px] px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
                    movForm.tipo === t.value
                      ? 'bg-accent text-white border-accent font-semibold'
                      : 'bg-bg-surface text-text-secondary border-border hover:border-accent/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Cantidad"
            type="number"
            step="0.01"
            min="0.01"
            value={movForm.cantidad}
            onChange={(e) => setMovForm({ ...movForm, cantidad: e.target.value })}
            placeholder="Ej: 10"
            required
          />

          <Select
            label="Unidad de medida"
            value={movForm.unidad_medida_id}
            onValueChange={(v) => setMovForm({ ...movForm, unidad_medida_id: v })}
            options={[
              { value: '', label: 'Seleccionar unidad...' },
              ...(unidades?.map((u) => ({ value: u.id, label: `${u.nombre} (${u.abreviatura})` })) ?? []),
            ]}
          />

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Motivo (opcional)</label>
            <textarea
              value={movForm.motivo}
              onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
              placeholder="Ej: Reposición de inventario"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {crearMovMutation.isError && (
            <p className="text-xs text-danger text-center">Error al registrar movimiento</p>
          )}

          <Button
            onClick={() => crearMovMutation.mutate()}
            loading={crearMovMutation.isPending}
            disabled={!movForm.producto_id || !movForm.cantidad || parseFloat(movForm.cantidad) < 0.01}
            className="w-full"
          >
            Registrar
          </Button>
        </div>
      </SidePanel>
    </div>
  )
}
