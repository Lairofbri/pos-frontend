import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarRecetas, crearReceta, actualizarReceta, eliminarReceta } from './api'
import type { Receta } from './api'
import { listarProductos } from '../productos/api'
import api from '../../../api/client'
import { CategoryNavigator } from '../../../components/shared/CategoryNavigator'
import { CategoryPanel } from '../../../components/shared/CategoryPanel'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToastStore } from '../../../store/toastStore'
import { PageHeader } from '../../../components/shared/PageHeader'
import { ErrorState } from '../../../components/shared/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { Icon } from '../../../components/shared/Icon'

interface RecetaRow {
  id: string; producto_id: string; producto_nombre: string; precio: number
  imagen_url: string | null; categoria_id: string | null; categoria_nombre: string | null
  rendimiento: number; instrucciones: string | null; num_ingredientes: number; creado_en: string
  version: number
}

interface IngredienteForm {
  ingrediente_id: string
  nombre: string
  cantidad: string
  unidad_medida_id: string
  preparacion: string
}

interface UnidadMedida {
  id: string
  nombre: string
  abreviatura: string
  categoria: string
  factor: number
}

interface CatalogoData {
  unidades_medida: UnidadMedida[]
}

export default function RecetasPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [catPanelOpen, setCatPanelOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [editando, setEditando] = useState<Receta | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Receta | null>(null)

  const [productoForm, setProductoForm] = useState({ nombre: '', precio: '', categoria_id: '', imagen_url: '' })
  const [rendimiento, setRendimiento] = useState('1')
  const [instrucciones, setInstrucciones] = useState('')
  const [ingredientes, setIngredientes] = useState<IngredienteForm[]>([])

  const { data: listado, isLoading, error, refetch } = useQuery({
    queryKey: ['recetas', categoriaActiva],
    queryFn: () => listarRecetas(categoriaActiva ? { categoria_id: categoriaActiva } : undefined),
    ...queryDefaults('recetas'),
  })

  const { data: productosDisponibles } = useQuery({
    queryKey: ['productos-menu'],
    queryFn: () => listarProductos({}),
    ...queryDefaults('productos-menu'),
  })

  const { data: catalogos } = useQuery<CatalogoData>({
    queryKey: ['catalogos'],
    queryFn: () => api.get('/catalogos').then(r => r.data.data),
    ...queryDefaults('catalogos'),
  })

  const unidades: UnidadMedida[] = catalogos?.unidades_medida ?? []

  const productosConStock = productosDisponibles?.filter((p) => p.tiene_stock && p.activo) ?? []
  const categoriasOptions = productosDisponibles
    ?.map((p) => ({ value: p.categoria_id ?? '', label: p.categoria_nombre ?? 'Sin categoría' }))
    .filter((v, i, a) => v.value && a.findIndex((t) => t.value === v.value) === i) ?? []

  const crearMutation = useMutation({
    mutationFn: () => crearReceta({
      producto: {
        nombre: productoForm.nombre,
        precio: parseFloat(productoForm.precio || '0'),
        categoria_id: productoForm.categoria_id || null,
        imagen_url: productoForm.imagen_url || null,
      },
      rendimiento: parseFloat(rendimiento),
      instrucciones: instrucciones || undefined,
      ingredientes: ingredientes.map((i) => ({
        ingrediente_id: i.ingrediente_id,
        cantidad: parseFloat(i.cantidad),
        unidad_medida_id: i.unidad_medida_id,
        preparacion: i.preparacion || undefined,
      })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recetas'] })
      queryClient.invalidateQueries({ queryKey: ['productos-menu'] })
      cerrarPanel()
      showToast({ type: 'success', message: 'Receta creada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al crear receta' }),
  })

  const editarMutation = useMutation({
    mutationFn: () => {
      if (!editando) return Promise.reject()
      return actualizarReceta(editando.id, {
        producto: {
          nombre: productoForm.nombre,
          precio: parseFloat(productoForm.precio || '0'),
          categoria_id: productoForm.categoria_id || null,
          imagen_url: productoForm.imagen_url || null,
        },
        rendimiento: parseFloat(rendimiento),
        instrucciones: instrucciones || undefined,
        ingredientes: ingredientes.map((i) => ({
          ingrediente_id: i.ingrediente_id,
          cantidad: parseFloat(i.cantidad),
          unidad_medida_id: i.unidad_medida_id,
          preparacion: i.preparacion || undefined,
        })),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recetas'] })
      queryClient.invalidateQueries({ queryKey: ['productos-menu'] })
      cerrarPanel()
      showToast({ type: 'success', message: 'Receta actualizada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al actualizar receta' }),
  })

  const eliminarMutation = useMutation({
    mutationFn: () => confirmDelete ? eliminarReceta(confirmDelete.id) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recetas'] })
      queryClient.invalidateQueries({ queryKey: ['productos-menu'] })
      setConfirmDelete(null)
      showToast({ type: 'success', message: 'Receta eliminada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al eliminar receta' }),
  })

  const abrirNueva = () => {
    setEditando(null)
    setProductoForm({ nombre: '', precio: '', categoria_id: categoriaActiva ?? '', imagen_url: '' })
    setRendimiento('1')
    setInstrucciones('')
    setIngredientes([{ ingrediente_id: '', nombre: '', cantidad: '', unidad_medida_id: '', preparacion: '' }])
    setPanelOpen(true)
  }

  const abrirEditar = async (r: RecetaRow) => {
    try {
      const recetaCompleta = await import('./api').then(m => m.obtenerReceta(r.id))
      setEditando(recetaCompleta)
      setProductoForm({
        nombre: recetaCompleta.producto_nombre,
        precio: String(recetaCompleta.precio),
        categoria_id: recetaCompleta.categoria_id ?? '',
        imagen_url: recetaCompleta.imagen_url ?? '',
      })
      setRendimiento(String(recetaCompleta.rendimiento))
      setInstrucciones(recetaCompleta.instrucciones ?? '')
      setIngredientes(recetaCompleta.ingredientes.map((ing) => ({
        ingrediente_id: ing.ingrediente_id,
        nombre: ing.ingrediente_nombre,
        cantidad: String(ing.cantidad),
        unidad_medida_id: ing.unidad_medida_id,
        preparacion: ing.preparacion ?? '',
      })))
      setPanelOpen(true)
    } catch {
      showToast({ type: 'error', message: 'Error al cargar receta' })
    }
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const agregarIngrediente = () => {
    setIngredientes([...ingredientes, { ingrediente_id: '', nombre: '', cantidad: '', unidad_medida_id: '', preparacion: '' }])
  }

  const actualizarIng = (idx: number, campo: keyof IngredienteForm, valor: string) => {
    const nuevos = [...ingredientes]
    if (campo === 'ingrediente_id') {
      const prod = productosConStock.find((p) => p.id === valor)
      nuevos[idx] = { ...nuevos[idx], ingrediente_id: valor, nombre: prod?.nombre ?? '' }
    } else {
      nuevos[idx] = { ...nuevos[idx], [campo]: valor }
    }
    setIngredientes(nuevos)
  }

  const quitarIngrediente = (idx: number) => {
    if (ingredientes.length <= 1) return
    setIngredientes(ingredientes.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Recetas" subtitle="Composición de platillos e ingredientes" onNew={abrirNueva} newLabel="Nueva receta" />

      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        <CategoryNavigator
          module="receta"
          onSelect={(catId) => setCategoriaActiva(catId)}
          onNewCategory={() => setCatPanelOpen(true)}
          onEditCategory={() => setCatPanelOpen(true)}
        />

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <ErrorState message="Error al cargar recetas" onRetry={() => refetch()} />
        ) : (listado?.recetas ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-secondary">
            <Icon name="utensils" className="size-8" />
            <span className="font-semibold text-sm text-text-primary">Sin recetas</span>
            <span className="text-xs">Crea una receta para empezar</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {(listado?.recetas ?? []).map((r, i) => {
              const row = r as RecetaRow
              return (
                <div
                  key={row.id}
                  onClick={() => abrirEditar(row)}
                  className="bg-white border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-accent hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                  style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both` }}
                >
                  <div className="h-28 bg-gradient-to-b from-accent/5 to-accent/10 flex items-center justify-center">
                    {row.imagen_url ? (
                      <img src={row.imagen_url} alt={row.producto_nombre} className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="utensils" className="size-10 text-accent" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-sm text-text-primary truncate">{row.producto_nombre}</h3>
                      <span className="font-mono text-sm font-bold text-accent">${row.precio?.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="info" className="text-[10px]">{row.num_ingredientes} ing.</Badge>
                      {row.categoria_nombre && <Badge variant="default" className="text-[10px]">{row.categoria_nombre}</Badge>}
                      <Badge variant="warning" className="text-[10px]">{row.rendimiento} porciones</Badge>
                      {row.version > 1 && <Badge variant="default" className="text-[10px]">v{row.version}</Badge>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CategoryPanel open={catPanelOpen} onClose={() => setCatPanelOpen(false)} module="receta" />

      <SidePanel
        open={panelOpen}
        onClose={cerrarPanel}
        title={editando ? 'Editar receta' : 'Nueva receta'}
        className="w-full sm:max-w-lg"
      >
        <div className="flex flex-col gap-4 p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="border-b border-border pb-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Platillo</h3>
            <div className="flex flex-col gap-3">
              <Input label="Nombre del platillo" value={productoForm.nombre} onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })} required />
              <Input label="Precio" type="number" step="0.01" value={productoForm.precio} onChange={(e) => setProductoForm({ ...productoForm, precio: e.target.value })} required />
              <Select
                label="Categoría"
                value={productoForm.categoria_id}
                onValueChange={(v) => setProductoForm({ ...productoForm, categoria_id: v })}
                options={[{ value: '', label: 'Sin categoría' }, ...categoriasOptions]}
              />
              <Input label="URL de imagen (opcional)" value={productoForm.imagen_url} onChange={(e) => setProductoForm({ ...productoForm, imagen_url: e.target.value })} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Ingredientes</h3>
            <div className="flex flex-col gap-3">
              {ingredientes.map((ing, idx) => (
                <div key={idx} className="bg-bg-surface rounded-lg p-3 border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[11px] font-semibold text-text-secondary">#{idx + 1}</span>
                    {ingredientes.length > 1 && (
                      <button onClick={() => quitarIngrediente(idx)} className="text-text-secondary hover:text-danger cursor-pointer">
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Select
                      value={ing.ingrediente_id}
                      onValueChange={(v) => actualizarIng(idx, 'ingrediente_id', v)}
                      options={[{ value: '', label: 'Seleccionar ingrediente...' }, ...productosConStock.map((p) => ({ value: p.id, label: `${p.nombre} (stock: ${p.stock_actual})` }))]}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input label="Cantidad" type="number" step="0.01" min="0.01" value={ing.cantidad} onChange={(e) => actualizarIng(idx, 'cantidad', e.target.value)} placeholder="0.00" />
                      <Select label="Unidad" value={ing.unidad_medida_id} onValueChange={(v) => actualizarIng(idx, 'unidad_medida_id', v)} options={[{ value: '', label: 'Unidad...' }, ...unidades.map(u => ({ value: u.id, label: u.abreviatura }))]} />
                    </div>
                    <Input label="Preparación (opcional)" value={ing.preparacion} onChange={(e) => actualizarIng(idx, 'preparacion', e.target.value)} placeholder="Ej: picado, en julianas" />
                  </div>
                </div>
              ))}
              <button onClick={agregarIngrediente} className="flex items-center justify-center gap-1 py-2 text-xs text-accent border border-dashed border-accent/30 rounded-lg hover:bg-accent/5 cursor-pointer">
                <Plus className="size-4" /> Agregar ingrediente
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Configuración</h3>
            <Input label="Rendimiento (porciones)" type="number" step="0.01" min="0.01" value={rendimiento} onChange={(e) => setRendimiento(e.target.value)} />
            <div className="mt-3">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1 block">Instrucciones (opcional)</label>
              <textarea value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} placeholder="Ej: Saltear el arroz..." className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
            </div>
          </div>

          <Button
            onClick={() => editando ? editarMutation.mutate() : crearMutation.mutate()}
            loading={crearMutation.isPending || editarMutation.isPending}
            disabled={!productoForm.nombre || !productoForm.precio || ingredientes.some((i) => !i.ingrediente_id || !i.cantidad || !i.unidad_medida_id)}
            className="w-full"
          >
            {editando ? 'Guardar cambios' : 'Crear receta'}
          </Button>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar receta"
        message={`¿Eliminar la receta de "${confirmDelete?.producto_nombre}"? El platillo se desactivará del menú.`}
        onConfirm={() => eliminarMutation.mutate()}
        onCancel={() => setConfirmDelete(null)}
        loading={eliminarMutation.isPending}
      />
    </div>
  )
}
