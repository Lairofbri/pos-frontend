import { useState, useMemo, useCallback, useRef } from 'react'
import { FolderTree, Package } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarProductos, crearProducto, actualizarProducto, subirImagen, eliminarImagenProducto } from './api'
import { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from '../../../api/categorias'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Toggle } from '../../../components/ui/Toggle'
import { Spinner } from '@/components/ui/Spinner'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { IconSelect } from '../../../components/shared/IconSelect'
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
  const [catForm, setCatForm] = useState({ nombre: '', icono: '' })
  const [catNivel1, setCatNivel1] = useState('')
  const [catNivel2, setCatNivel2] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const [prodModalOpen, setProdModalOpen] = useState(false)
  const [prodEditando, setProdEditando] = useState<Producto | null>(null)
  const [prodForm, setProdForm] = useState({
    nombre: '', descripcion: '', precio: 0, categoria_id: '',
    codigo: '', imagen_url: '', orden: 0, activo: true,
    tiene_stock: false, stock_minimo: 0, se_vende: true,
  })

  const { data: categoriasData, isLoading: catLoading } = useQuery({
    queryKey: ['categorias-arbol'],
    queryFn: () => listarCategorias({ arbol: true }),
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

  const catOptionsNivel1 = allCategoriesPlanas.filter(c => !c.parent_id && c.activo).map(c => ({ value: c.id, label: c.nombre }))
  const catOptionsNivel2 = allCategoriesPlanas
    .filter(c => c.parent_id === catNivel1 && c.activo)
    .map(c => ({ value: c.id, label: c.nombre }))

  const catParentId = catNivel2 || catNivel1 || undefined

  const crearCatMutation = useMutation({
    mutationFn: () => crearCategoria({
      nombre: catForm.nombre,
      parent_id: catParentId,
      icono: catForm.icono || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] })
      cerrarPanelCat()
      showToast({ type: 'success', message: 'Categoría creada' })
    },
  })

  const editarCatMutation = useMutation({
    mutationFn: () => catEditando
      ? actualizarCategoria(catEditando.id, {
          nombre: catForm.nombre,
          parent_id: catParentId,
          icono: catForm.icono || undefined,
        })
      : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] })
      cerrarPanelCat()
      showToast({ type: 'success', message: 'Categoría actualizada' })
    },
  })

  const eliminarCatMutation = useMutation({
    mutationFn: () => confirmDelete ? eliminarCategoria(confirmDelete.id) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] })
      setConfirmDelete(null)
      cerrarPanelCat()
      showToast({ type: 'success', message: 'Categoría eliminada' })
    },
  })

  const getLevel = (id: string, lvl = 0): number => {
    const c = allCategoriesPlanas.find(x => x.id === id)
    if (!c?.parent_id) return lvl
    return getLevel(c.parent_id, lvl + 1)
  }

  const abrirNuevaCat = (parentId?: string) => {
    if (parentId && categoriasData) {
      const buildChain = (items: Categoria[], targetId: string): Categoria[] => {
        for (const c of items) {
          if (c.id === targetId) return [c]
          if (c.hijos?.length) {
            const found = buildChain(c.hijos, targetId)
            if (found.length) return [c, ...found]
          }
        }
        return []
      }
      const chainResult = buildChain(categoriasData, parentId)
      setCatNivel1(chainResult[0]?.id ?? '')
      setCatNivel2(chainResult[1]?.id ?? '')
    } else {
      setCatNivel1('')
      setCatNivel2('')
    }
    setCatEditando(null)
    setCatForm({ nombre: '', icono: '' })
    setCatPanelOpen(true)
  }

  const abrirEditarCat = (item: Categoria) => {
    const chain = categoriasData ? (() => {
      const buildChain = (items: Categoria[], targetId: string | null): Categoria[] => {
        if (!targetId) return []
        for (const c of items) {
          if (c.id === targetId) return [c]
          if (c.hijos?.length) {
            const found = buildChain(c.hijos, targetId)
            if (found.length) return [c, ...found]
          }
        }
        return []
      }
      return buildChain(categoriasData, item.parent_id)
    })() : []
    setCatNivel1(chain[0]?.id ?? '')
    setCatNivel2(chain[1]?.id ?? '')
    setCatEditando(item)
    setCatForm({ nombre: item.nombre, icono: item.icono ?? '' })
    setCatPanelOpen(true)
  }

  const cerrarPanelCat = () => {
    setCatPanelOpen(false)
    setCatEditando(null)
    setCatForm({ nombre: '', icono: '' })
    setCatNivel1('')
    setCatNivel2('')
    setConfirmDelete(null)
  }

  const guardarCat = () => {
    if (catParentId) {
      const parentLevel = getLevel(catParentId) + 1
      if (parentLevel >= 3) {
        showToast({ type: 'error', message: 'Máximo 3 niveles de categorías.' })
        return
      }
    }
    if (catEditando) editarCatMutation.mutate()
    else crearCatMutation.mutate()
  }

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
    mutationFn: () => crearProducto({
      nombre: prodForm.nombre,
      descripcion: prodForm.descripcion || undefined,
      precio: prodForm.precio,
      categoria_id: prodForm.categoria_id || undefined,
      codigo: prodForm.codigo || undefined,
      imagen_url: prodForm.imagen_url || undefined,
      tiene_stock: prodForm.tiene_stock,
      stock_minimo: prodForm.stock_minimo,
      se_vende: true,
      tiene_receta: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      cerrarProdModal()
      showToast({ type: 'success', message: 'Producto creado' })
    },
  })

  const editarProdMutation = useMutation({
    mutationFn: () => prodEditando
      ? actualizarProducto(prodEditando.id, {
          nombre: prodForm.nombre,
          descripcion: prodForm.descripcion || undefined,
          precio: prodForm.precio,
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
    setProdForm({
      nombre: '', descripcion: '', precio: 0, categoria_id: catActivaId ?? '',
      codigo: '', imagen_url: '', orden: 0, activo: true,
      tiene_stock: false, stock_minimo: 0, se_vende: true,
    })
    setProdModalOpen(true)
  }

  const abrirEditarProd = (p: Producto) => {
    setProdEditando(p)
    setProdForm({
      nombre: p.nombre, descripcion: p.descripcion ?? '', precio: p.precio,
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
                    <button
                      onClick={(e) => { e.stopPropagation(); abrirEditarCat(cat) }}
                      className="absolute top-2 right-2 size-6 rounded-full bg-white/80 border border-border flex items-center justify-center text-text-secondary opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent transition-all cursor-pointer"
                      title="Editar categoría"
                    >
                      <Icon name="edit" className="size-3.5" />
                    </button>
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
                onClick={() => abrirNuevaCat(catActivaId ?? undefined)}
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

      {/* Category SidePanel */}
      <SidePanel open={catPanelOpen} onClose={cerrarPanelCat} title={catEditando ? 'Editar Categoría' : 'Nueva Categoría'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre" value={catForm.nombre} onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })} required autoFocus />
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Categoría padre</label>
            <Select label="Nivel 1" options={catOptionsNivel1} value={catNivel1}
              onValueChange={(v) => { setCatNivel1(v); setCatNivel2('') }} placeholder="— Raíz —" />
            {catNivel1 && (
              <Select label="Nivel 2" options={catOptionsNivel2} value={catNivel2}
                onValueChange={(v) => setCatNivel2(v)} placeholder="— Ninguna —" />
            )}
          </div>
          <IconSelect label="Icono" value={catForm.icono} onChange={(v) => setCatForm({ ...catForm, icono: v })} />
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={guardarCat} loading={crearCatMutation.isPending || editarCatMutation.isPending}>
              {catEditando ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
            {catEditando && <Button variant="danger" onClick={() => setConfirmDelete(catEditando)}>Eliminar</Button>}
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog open={!!confirmDelete} title="Eliminar categoría"
        message={`¿Desactivar "${confirmDelete?.nombre}"? Los productos asociados pasarán a sin categoría.`}
        confirmLabel="Desactivar" onConfirm={() => eliminarCatMutation.mutate()}
        onCancel={() => setConfirmDelete(null)} loading={eliminarCatMutation.isPending} />

      {/* Product Modal */}
      {prodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={cerrarProdModal} />
          <div className="relative bg-white rounded-xl shadow-xl overflow-hidden w-[95vw] sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="h-9 bg-gradient-to-r from-accent-dark to-accent flex items-center px-4 shrink-0">
              <span className="text-white text-sm font-semibold">{prodEditando ? 'Editar Producto' : 'Nuevo Producto'}</span>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <Input label="Nombre" value={prodForm.nombre} onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })} required />
              <Input label="Descripción" value={prodForm.descripcion} onChange={(e) => setProdForm({ ...prodForm, descripcion: e.target.value })} />
              <Input label="Precio" type="number" step="0.01" value={prodForm.precio} onChange={(e) => setProdForm({ ...prodForm, precio: parseFloat(e.target.value || '0') })} />
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
                {crearProdMutation.isPending || editarProdMutation.isPending ? 'Guardando...' : prodEditando ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
