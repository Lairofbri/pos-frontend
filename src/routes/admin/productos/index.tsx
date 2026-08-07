import { useState, useMemo, useCallback, useRef } from 'react'
import { FolderTree, Package, TrendingUp } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarProductos, crearProducto, actualizarProducto, subirImagen, eliminarImagenProducto, listarRentabilidad, type RentabilidadFiltros } from './api'
import { listarCategorias } from '../../../api/categorias'
import { CategoryPanel } from '../../../components/shared/CategoryPanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Toggle } from '../../../components/ui/Toggle'
import { Spinner } from '@/components/ui/Spinner'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '../../../store/toastStore'
import { Icon } from '../../../components/shared/Icon'
import type { Producto, Categoria } from '../../../types'

function flattenAllCategories(items: Categoria[]): Categoria[] {
  const result: Categoria[] = []
  for (const item of items) {
    result.push(item)
    if (item.hijos?.length) result.push(...flattenAllCategories(item.hijos))
  }
  return result
}

function findCategoria(items: Categoria[], id: string): Categoria | null {
  for (const c of items) {
    if (c.id === id) return c
    if (c.hijos?.length) {
      const found = findCategoria(c.hijos, id)
      if (found) return found
    }
  }
  return null
}

const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/api$/, '')
const imgAbs = (url: string) => url.startsWith('/') ? `${apiBase}${url}` : url

export default function ProductosPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  const [catPanelOpen, setCatPanelOpen] = useState(false)
  const [catEditando, setCatEditando] = useState<Categoria | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const [prodModalOpen, setProdModalOpen] = useState(false)
  const [prodEditando, setProdEditando] = useState<Producto | null>(null)
  const [origen, setOrigen] = useState<'nuevo' | 'inventario'>('nuevo')
  const [inventarioItemId, setInventarioItemId] = useState('')
  const [prodForm, setProdForm] = useState({
    nombre: '', descripcion: '', precio: 0, precio_costo: 0, categoria_id: '',
    codigo: '', imagen_url: '', orden: 0, activo: true,
    tiene_stock: false, stock_minimo: 0, se_vende: true,
  })

  const { data: categoriasData, isLoading: catLoading } = useQuery({
    queryKey: ['categorias-arbol', 'producto'],
    queryFn: () => listarCategorias({ arbol: true, modulo: 'producto' }),
    ...queryDefaults('categorias'),
  })

  const allCategoriesPlanas = useMemo(() => categoriasData ? flattenAllCategories(categoriasData) : [], [categoriasData])

  const [navStack, setNavStack] = useState<(string | null)[]>([null])
  const currentNavId = navStack[navStack.length - 1]
  const isRoot = currentNavId === null

  const currentCategories = useMemo<Categoria[]>(() => {
    if (!categoriasData) return []
    if (currentNavId === null) return categoriasData.filter((c: Categoria) => c.activo !== false)
    const found = findCategoria(categoriasData, currentNavId)
    return found?.hijos?.filter((c: Categoria) => c.activo !== false) ?? []
  }, [categoriasData, currentNavId])

  const currentNavName = useMemo(() => {
    if (currentNavId === null) return 'Categorías'
    const found = currentNavId === 'todos' ? null : findCategoria(categoriasData ?? [], currentNavId)
    return found?.nombre ?? 'Todos los productos'
  }, [categoriasData, currentNavId])

  const showAllProducts = currentNavId === null && navStack.length === 2 && navStack[0] === null && navStack[1] === 'todos'
  const catActivaId = showAllProducts ? null : currentNavId
  const isLeaf = currentCategories.length === 0
  const showProductLevel = (isLeaf && catActivaId !== null) || showAllProducts

  const [tab, setTab] = useState<'productos' | 'rentabilidad'>('productos')
  const [rentaOrden, setRentaOrden] = useState<RentabilidadFiltros['orden']>('margen_desc')
  const [rentaCategoria, setRentaCategoria] = useState('')

  const { data: rentabilidad, isLoading: rentaLoading } = useQuery({
    queryKey: ['rentabilidad', rentaOrden, rentaCategoria],
    queryFn: () => listarRentabilidad({ orden: rentaOrden, categoria_id: rentaCategoria || undefined }),
    enabled: tab === 'rentabilidad',
    ...queryDefaults('rentabilidad'),
  })

  const { data: productos, isLoading: prodLoading, error, refetch } = useQuery({
    queryKey: ['productos', catActivaId],
    queryFn: () => listarProductos({
      categoria_id: catActivaId ?? undefined,
      se_vende: true,
      tiene_receta: false,
    }),
    enabled: showProductLevel,
    ...queryDefaults('productos'),
  })

  const { data: inventarioDisponible } = useQuery({
    queryKey: ['productos-inventario-disponible'],
    queryFn: () => listarProductos({ tiene_stock: true, se_vende: false }),
    ...queryDefaults('productos'),
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subiendoImg, setSubiendoImg] = useState(false)

  const subirImgMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => subirImagen(id, file),
    onSuccess: (producto) => {
      setProdForm((prev) => ({ ...prev, imagen_url: producto.imagen_url ?? '' }))
      showToast({ type: 'success', message: 'Imagen subida' })
      setSubiendoImg(false)
    },
    onError: () => { setSubiendoImg(false); showToast({ type: 'error', message: 'Error al subir imagen' }) },
  })

  const eliminarImgMutation = useMutation({
    mutationFn: () => prodEditando ? eliminarImagenProducto(prodEditando.id) : Promise.reject(),
    onSuccess: () => {
      setProdForm((prev) => ({ ...prev, imagen_url: '' }))
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      showToast({ type: 'success', message: 'Imagen eliminada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al eliminar imagen' }),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !prodEditando) return
    setSubiendoImg(true)
    subirImgMutation.mutate({ id: prodEditando.id, file })
  }

  const crearProdMutation = useMutation({
    mutationFn: () => {
      if (origen === 'inventario' && inventarioItemId) {
        return actualizarProducto(inventarioItemId, {
          nombre: prodForm.nombre,
          descripcion: prodForm.descripcion || undefined,
          precio: prodForm.precio,
          precio_costo: prodForm.precio_costo,
          categoria_id: prodForm.categoria_id || undefined,
          codigo: prodForm.codigo || undefined,
          imagen_url: prodForm.imagen_url || undefined,
          stock_minimo: prodForm.stock_minimo,
          se_vende: true,
          tiene_receta: false,
        })
      }
      return crearProducto({
        nombre: prodForm.nombre,
        descripcion: prodForm.descripcion || undefined,
        precio: prodForm.precio,
        precio_costo: prodForm.precio_costo,
        categoria_id: prodForm.categoria_id || undefined,
        codigo: prodForm.codigo || undefined,
        imagen_url: prodForm.imagen_url || undefined,
        tiene_stock: prodForm.tiene_stock,
        stock_minimo: prodForm.stock_minimo,
        se_vende: true,
        tiene_receta: false,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-inventario-disponible'] })
      cerrarProdModal()
      showToast({ type: 'success', message: origen === 'inventario' ? 'Producto activado desde inventario' : 'Producto creado' })
    },
  })

  const editarProdMutation = useMutation({
    mutationFn: () => prodEditando
      ? actualizarProducto(prodEditando.id, {
          nombre: prodForm.nombre,
          descripcion: prodForm.descripcion || undefined,
          precio: prodForm.precio,
          precio_costo: prodForm.precio_costo,
          categoria_id: prodForm.categoria_id || undefined,
          codigo: prodForm.codigo || undefined,
          imagen_url: prodForm.imagen_url || undefined,
          activo: prodForm.activo,
          tiene_stock: prodForm.tiene_stock,
          stock_minimo: prodForm.stock_minimo,
          se_vende: true,
          tiene_receta: false,
        })
      : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      cerrarProdModal()
      showToast({ type: 'success', message: 'Producto actualizado' })
    },
  })

  const toggleProductoActivo = useCallback(async (producto: Producto) => {
    try {
      await actualizarProducto(producto.id, { activo: !producto.activo })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    } catch { showToast({ type: 'error', message: 'Error al cambiar estado' }) }
  }, [queryClient, showToast])

  const abrirNuevoProd = () => {
    setProdEditando(null)
    setOrigen('nuevo')
    setInventarioItemId('')
    setProdForm({
      nombre: '', descripcion: '', precio: 0, precio_costo: 0, categoria_id: catActivaId ?? '',
      codigo: '', imagen_url: '', orden: 0, activo: true,
      tiene_stock: false, stock_minimo: 0, se_vende: true,
    })
    setProdModalOpen(true)
  }

  const abrirEditarProd = (p: Producto) => {
    setProdEditando(p)
    setProdForm({
      nombre: p.nombre, descripcion: p.descripcion ?? '', precio: p.precio, precio_costo: p.precio_costo,
      categoria_id: p.categoria_id ?? '', codigo: p.codigo ?? '',
      imagen_url: p.imagen_url ?? '', orden: p.orden ?? 0, activo: p.activo,
      tiene_stock: p.tiene_stock, stock_minimo: p.stock_minimo,
      se_vende: p.se_vende,
    })
    setProdModalOpen(true)
  }

  const cerrarProdModal = () => { setProdModalOpen(false); setProdEditando(null) }

  const guardarProd = () => {
    if (prodEditando) editarProdMutation.mutate()
    else crearProdMutation.mutate()
  }

  const categoriasOptions = allCategoriesPlanas
    .filter((c) => c.activo)
    .map((c) => ({ value: c.id, label: c.nombre }))

  const navigateTo = (cat: Categoria) => {
    setNavStack(prev => [...prev, cat.id])
    setBusqueda('')
  }

  const goBack = () => {
    if (navStack.length <= 1) return
    setNavStack(prev => prev.slice(0, -1))
    setBusqueda('')
  }

  if (prodLoading && catLoading && isRoot) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Bar */}
      <div className="flex items-center gap-3 mb-2 shrink-0 px-4 pt-2">
        <button
          onClick={goBack}
          className={`size-9 rounded-xl border border-border bg-white flex items-center justify-center text-text-primary cursor-pointer transition-all hover:bg-bg-surface active:scale-95 ${navStack.length <= 1 ? 'invisible' : ''}`}
        >
          <Icon name="arrow-left" className="size-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-text-primary truncate">{currentNavName}</span>
          <span className="text-xs font-medium text-text-secondary bg-bg-surface px-2 py-0.5 rounded-full shrink-0">
            {showProductLevel && productos ? productos.length : currentCategories.length}
          </span>
        </div>
      </div>

      {/* Level Dots */}
      <div className="flex items-center gap-1.5 mb-2 shrink-0 px-4">
        {navStack.map((_id, i) => {
          const isLast = i === navStack.length - 1
          return (
            <button
              key={i}
              onClick={i < navStack.length - 1 ? () => setNavStack(prev => prev.slice(0, i + 1)) : undefined}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${isLast ? 'w-5 bg-accent' : 'w-1.5 bg-accent/40 hover:bg-accent'}`}
            />
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-3 shrink-0">
        <button
          onClick={() => setTab('productos')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            tab === 'productos'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setTab('rentabilidad')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            tab === 'rentabilidad'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          Rentabilidad
        </button>
      </div>

      {/* Productos tab */}
      {tab === 'productos' && (<>

      {/* Search (product level only) */}
      {showProductLevel && (
        <div className="px-4 mb-3 shrink-0">
          <div className="flex items-center gap-2 bg-bg-surface rounded-xl px-3 py-2 border border-border focus-within:border-accent transition-all">
            <Icon name="search" className="size-4 text-text-secondary shrink-0" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4 px-4">
        {/* Category Cards Level */}
        {!showProductLevel && (
          <>
            {currentCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-1 text-text-secondary">
                <FolderTree className="size-8 mb-1" />
                <span className="font-semibold text-sm text-text-primary">Sin subcategorías</span>
                <span className="text-xs">Crea una categoría para organizar productos</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentCategories.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => navigateTo(cat)}
                    className="group relative bg-white border border-border rounded-xl p-4 cursor-pointer flex flex-col items-center text-center gap-2 transition-all hover:border-accent hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(198,106,30,0.12)] active:scale-[0.97]"
                    style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both` }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setCatEditando(cat); setCatPanelOpen(true) } }}
                      onClick={(e) => { e.stopPropagation(); setCatEditando(cat); setCatPanelOpen(true) }}
                      className="absolute top-2 right-2 size-6 rounded-full bg-white/80 border border-border flex items-center justify-center text-text-secondary opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent transition-all cursor-pointer"
                    >
                      <Icon name="edit" className="size-3.5" />
                    </div>
                    <div className="size-11 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center transition-transform group-hover:scale-110">
                      {cat.icono ? <Icon name={cat.icono} className="size-6" /> : <FolderTree className="size-6 text-accent" />}
                    </div>
                    <span className="font-semibold text-sm text-text-primary leading-tight">{cat.nombre}</span>
                    <span className="text-xs font-medium text-text-secondary bg-bg-surface px-2 py-0.5 rounded-full">
                      {cat.hijos ? cat.hijos.filter(p => p.activo !== false).length : 0} subcategorías
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-center mt-5">
              <button
                onClick={() => { setCatEditando(null); setCatPanelOpen(true) }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-accent-dark to-accent text-white text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(184,97,25,0.4)] active:scale-[0.97] shadow-[0_4px_12px_rgba(184,97,25,0.3)]"
              >
                + Nueva Categoría
              </button>
            </div>
          </>
        )}

        {/* Product Level */}
        {showProductLevel && (
          <>
            {prodLoading ? (
              <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Icon name="alert" className="size-8 text-danger" />
                <p className="text-danger text-sm">{error.message}</p>
                <Button size="sm" onClick={() => refetch()}>Reintentar</Button>
              </div>
            ) : productos?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-1 text-text-secondary">
                <Package className="size-8 mb-1" />
                <span className="font-semibold text-sm text-text-primary">Sin productos</span>
                <span className="text-xs">Agrega productos a esta categoría</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(productos ?? []).filter(p => {
                  if (!busqueda) return true
                  const q = busqueda.toLowerCase()
                  return p.nombre.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q)
                }).map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => abrirEditarProd(p)}
                    className="rounded-xl border-2 border-border bg-white overflow-hidden flex flex-col cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-accent/30 active:scale-[0.98]"
                    style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both` }}
                  >
                    <div className="h-24 bg-gradient-to-b from-accent/5 to-accent/10 flex items-center justify-center shrink-0">
                      {p.imagen_url ? (
                        <img src={imgAbs(p.imagen_url)} alt={p.nombre} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <Package className="size-10 text-accent/60" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col px-3 py-2 gap-1">
                      <span className="font-semibold text-sm text-text-primary leading-tight truncate">{p.nombre}</span>
                      <span className="text-base font-bold text-accent">${p.precio.toFixed(2)}</span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge variant={p.tiene_stock ? (p.stock_actual <= p.stock_minimo ? 'danger' : 'success') : 'default'} className="text-[10px]">
                          {p.tiene_stock ? `Stock: ${p.stock_actual}` : 'Sin stock'}
                        </Badge>
                        {p.codigo && <Badge variant="default" className="text-[10px]">{p.codigo}</Badge>}
                      </div>
                    </div>
                    <div className="border-t border-border px-3 py-2 flex items-center justify-between shrink-0">
                      <span className="text-[10px] text-text-secondary">{p.categoria_nombre || '—'}</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Toggle checked={p.activo} onChange={() => toggleProductoActivo(p)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center mt-5">
              <button
                onClick={abrirNuevoProd}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-accent-dark to-accent text-white text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(184,97,25,0.4)] active:scale-[0.97] shadow-[0_4px_12px_rgba(184,97,25,0.3)]"
              >
                + Agregar Producto
              </button>
            </div>
          </>
        )}

        {/* All products quick access */}
        {isRoot && categoriasData && categoriasData.length > 0 && !showAllProducts && (
          <div className="flex justify-center mt-3">
            <button onClick={() => setNavStack(prev => [...prev, 'todos'])}
              className="text-xs font-medium text-accent-dark hover:underline cursor-pointer">
              Ver todos los productos →
            </button>
          </div>
        )}
      </div>

      {/* Category Panel */}
      <CategoryPanel
        module="producto"
        variant="modal"
        open={catPanelOpen}
        onClose={() => { setCatPanelOpen(false); setCatEditando(null) }}
        editing={catEditando}
      />

      {/* Product SidePanel */}
      <SidePanel
        open={prodModalOpen}
        onClose={cerrarProdModal}
        title={prodEditando ? 'Editar Producto' : 'Nuevo Producto'}
        direction="right"
      >
        <div className="flex flex-col gap-4">
          {!prodEditando && (
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Origen</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setOrigen('nuevo'); setInventarioItemId(''); setProdForm(f => ({ ...f, nombre: '', tiene_stock: false })) }}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${origen === 'nuevo' ? 'bg-accent text-white border-accent font-semibold' : 'bg-bg-surface text-text-secondary border-border hover:border-accent/40'}`}
                >
                  Crear nuevo
                </button>
                <button
                  onClick={() => setOrigen('inventario')}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${origen === 'inventario' ? 'bg-accent text-white border-accent font-semibold' : 'bg-bg-surface text-text-secondary border-border hover:border-accent/40'}`}
                >
                  Desde inventario
                </button>
              </div>
            </div>
          )}

          {!prodEditando && origen === 'inventario' && (
            <Select
              label="Seleccionar insumo"
              value={inventarioItemId}
              onValueChange={(v) => {
                setInventarioItemId(v)
                const item = inventarioDisponible?.find(p => p.id === v)
                if (item) {
                  setProdForm({
                    ...prodForm,
                    nombre: item.nombre,
                    categoria_id: item.categoria_id ?? '',
                    imagen_url: item.imagen_url ?? '',
                    tiene_stock: true,
                    stock_minimo: item.stock_minimo ?? 0,
                  })
                }
              }}
              options={[
                { value: '', label: 'Seleccionar insumo...' },
                ...(inventarioDisponible?.filter(p => p.activo !== false).map((p) => ({
                  value: p.id,
                  label: `${p.nombre} (stock: ${p.stock_actual})`,
                })) ?? []),
              ]}
              placeholder="Buscar insumo..."
            />
          )}

          <Input label="Nombre" value={prodForm.nombre} onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })} required />
          <Input label="Descripción" value={prodForm.descripcion} onChange={(e) => setProdForm({ ...prodForm, descripcion: e.target.value })} />
          <Input label="Precio" type="number" step="0.01" value={prodForm.precio} onChange={(e) => setProdForm({ ...prodForm, precio: parseFloat(e.target.value || '0') })} />
          <Input label="Costo ($)" type="number" step="0.01" min="0" value={prodForm.precio_costo} onChange={(e) => setProdForm({ ...prodForm, precio_costo: parseFloat(e.target.value || '0') })} />
          <Select label="Categoría" options={categoriasOptions} value={prodForm.categoria_id}
            onValueChange={(v) => setProdForm({ ...prodForm, categoria_id: v })} placeholder="Sin categoría" />
          <Input label="Código de barras" value={prodForm.codigo} onChange={(e) => setProdForm({ ...prodForm, codigo: e.target.value })} placeholder="Opcional" />

          {/* Image */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-secondary">Imagen</label>
            {prodForm.imagen_url && (
              <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border mb-1">
                <img src={imgAbs(prodForm.imagen_url)} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
            <div className="flex gap-2">
              {prodEditando && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={subiendoImg}
                    className="flex-1 h-8 text-xs font-medium rounded-full border border-accent text-accent bg-transparent hover:bg-accent hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                    {subiendoImg ? 'Subiendo...' : prodForm.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
                  </button>
                </>
              )}
              {prodForm.imagen_url && prodEditando && (
                <button type="button" onClick={() => eliminarImgMutation.mutate()} disabled={eliminarImgMutation.isPending}
                  className="h-8 px-4 text-xs font-medium rounded-full border border-danger text-danger bg-transparent hover:bg-danger hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                  {eliminarImgMutation.isPending ? '...' : 'Eliminar'}
                </button>
              )}
            </div>
            <input type="text" placeholder="O pega una URL..." value={prodForm.imagen_url}
              onChange={(e) => setProdForm({ ...prodForm, imagen_url: e.target.value })}
              className="w-full h-7 px-3 rounded-lg border border-border text-xs text-text-primary placeholder:text-text-secondary outline-none focus:border-accent transition-colors" />
          </div>

          {/* Stock section */}
          <div className="border-t border-border pt-3">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Control de stock</h4>
            <Toggle checked={prodForm.tiene_stock} onChange={(v) => setProdForm({ ...prodForm, tiene_stock: v })} label="Tiene control de stock" />
            {prodForm.tiene_stock && (
              <div className="mt-3">
                <Input label="Stock mínimo" type="number" min="0" value={prodForm.stock_minimo}
                  onChange={(e) => setProdForm({ ...prodForm, stock_minimo: parseInt(e.target.value || '0') })} />
              </div>
            )}
          </div>

          {prodEditando && (
            <Toggle checked={prodForm.activo} onChange={(v) => setProdForm({ ...prodForm, activo: v })} label="Producto activo" />
          )}

          <button onClick={guardarProd}
            disabled={!prodForm.nombre || crearProdMutation.isPending || editarProdMutation.isPending}
            className="w-full h-9 bg-gradient-to-r from-accent-dark to-accent text-white text-sm font-semibold rounded-full shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90">
            {crearProdMutation.isPending || editarProdMutation.isPending ? 'Guardando...' : prodEditando ? 'Guardar cambios' : origen === 'inventario' && inventarioItemId ? 'Activar como producto' : 'Crear producto'}
          </button>
        </div>
      </SidePanel>
      </>)}
      {/* Rentabilidad tab */}
      {tab === 'rentabilidad' && (
        <div className="flex-1 overflow-y-auto pb-4 px-4">
          {rentaLoading ? (
            <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex items-center gap-3 mb-4">
                <Select
                  label="Orden"
                  value={rentaOrden}
                  onValueChange={(v) => setRentaOrden(v as RentabilidadFiltros['orden'])}
                  options={[
                    { value: 'margen_desc', label: 'Mayor margen $' },
                    { value: 'margen_asc', label: 'Menor margen $' },
                    { value: 'precio_desc', label: 'Mayor precio' },
                    { value: 'precio_asc', label: 'Menor precio' },
                    { value: 'nombre', label: 'Nombre A-Z' },
                  ]}
                  className="w-44"
                />
                <Select
                  label="Categoría"
                  value={rentaCategoria}
                  onValueChange={(v) => setRentaCategoria(v)}
                  options={[
                    { value: '', label: 'Todas' },
                    ...allCategoriesPlanas.filter(c => c.activo).map(c => ({ value: c.id, label: c.nombre })),
                  ]}
                  className="w-44"
                />
              </div>

              {/* KPI Cards */}
              {rentabilidad && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white border border-border rounded-xl p-3">
                    <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Margen bruto total
                    </div>
                    <div className={`text-lg font-bold ${rentabilidad.resumen.margen_bruto_total >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      ${rentabilidad.resumen.margen_bruto_total.toLocaleString('es-SV', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white border border-border rounded-xl p-3">
                    <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Food cost promedio
                    </div>
                    <div className={`text-lg font-bold ${rentabilidad.resumen.food_cost_pct <= 40 ? 'text-emerald-600' : rentabilidad.resumen.food_cost_pct <= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {rentabilidad.resumen.food_cost_pct}%
                    </div>
                  </div>
                  <div className="bg-white border border-border rounded-xl p-3">
                    <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Sin costo
                    </div>
                    <div className={`text-lg font-bold ${rentabilidad.resumen.sin_costo_count === 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {rentabilidad.resumen.sin_costo_count}
                    </div>
                  </div>
                </div>
              )}

              {/* Rentabilidad Table */}
              {rentabilidad && rentabilidad.productos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-1 text-text-secondary">
                  <TrendingUp className="size-8 mb-1" />
                  <span className="font-semibold text-sm text-text-primary">Sin datos de rentabilidad</span>
                  <span className="text-xs">Registra compras con costo unitario para ver márgenes</span>
                </div>
              ) : rentabilidad ? (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-bg-surface">
                        <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Producto</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wider hidden sm:table-cell">Categoría</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Precio</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Costo</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wider">Margen $</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wider w-28">Margen %</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wider w-24">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentabilidad.productos.map((p, i) => {
                        const barColor = p.alerta === 'sin_datos' ? 'bg-slate-300'
                          : p.margen_pct >= 40 ? 'bg-emerald-500'
                          : p.margen_pct >= 20 ? 'bg-amber-500'
                          : 'bg-red-500'
                        const badgeColor = p.alerta === 'ganancia' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.alerta === 'equilibrio' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : p.alerta === 'perdida' ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                        const badgeLabel = p.alerta === 'ganancia' ? 'Ganancia'
                          : p.alerta === 'equilibrio' ? 'Equilibrio'
                          : p.alerta === 'perdida' ? 'Pérdida'
                          : 'Sin datos'
                        return (
                          <tr key={p.id} className={`border-b border-border hover:bg-bg-surface/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-bg-surface/30'}`}>
                            <td className="px-3 py-2.5 font-medium text-text-primary">
                              <span className="flex items-center gap-1.5">
                                {p.nombre}
                                {p.tiene_receta && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">Receta</span>}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-text-secondary hidden sm:table-cell">{p.categoria_nombre || '—'}</td>
                            <td className="px-3 py-2.5 text-right font-medium">${p.precio_venta.toFixed(2)}</td>
                            <td className={`px-3 py-2.5 text-right ${p.costo_promedio === 0 ? 'text-text-secondary' : ''}`}>
                              {p.costo_promedio === 0 ? '—' : `$${p.costo_promedio.toFixed(2)}`}
                            </td>
                            <td className={`px-3 py-2.5 text-right font-semibold ${p.margen_bruto < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {p.alerta === 'sin_datos' ? '—' : `${p.margen_bruto < 0 ? '-' : ''}$${Math.abs(p.margen_bruto).toFixed(2)}`}
                            </td>
                            <td className="px-3 py-2.5">
                              {p.alerta === 'sin_datos' ? (
                                <span className="text-text-secondary text-xs">—</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${barColor}`}
                                      style={{ width: `${Math.min(Math.abs(p.margen_pct), 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium w-10 text-right">{p.margen_pct}%</span>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                {badgeLabel}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}
