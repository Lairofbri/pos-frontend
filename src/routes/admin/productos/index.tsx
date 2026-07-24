import { useState, useMemo, useCallback, useRef } from 'react'
import { FolderTree, Package } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarProductos, crearProducto, actualizarProducto, subirImagen, eliminarImagenProducto } from './api'
import { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from '../categorias/api'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Toggle } from '../../../components/ui/Toggle'
import { Spinner } from '@/components/ui/Spinner'
import { SidePanel } from '../../../components/shared/SidePanel'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToastStore } from '../../../store/toastStore'
import type { Producto, Categoria } from '../../../types'

const DEFAULT_ICONS = ['📦', '⭐', '🔵', '🟢', '🟡', '🟠', '🔴', '🟣', '💠', '🔶', '🔷', '🟩', '🟥', '🟨', '⬜', '⬛']

const FOOD_EMOJIS = [
  '🍕', '🍔', '🍟', '🌭', '🥪', '🥗', '🥬', '🥦', '🌽', '🥕',
  '🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍑', '🥭', '🍍', '🥝',
  '🥩', '🍗', '🥓', '🍳', '🧀', '🍝', '🌮', '🌯', '🥟', '🧆',
  '🍦', '🍰', '🧁', '🍪', '🍩', '🍫', '🍬', '☕', '🧃', '🥤',
  '💧', '🍺', '🍷', '🧋', '🍵', '🥛', '🧊', '🧂', '🌶️', '🧄',
  '🥨', '🥖', '🧇', '🥞', '🧈', '🥚', '🧅', '🍄', '🫘', '🥜',
  '🍿', '🎂', '🍭', '🍮', '🍯', '🧉', '🥂', '🍸', '🍹', '🍾',
]

const iconoPorDefecto = (nombre: string): string => {
  const mapa: Record<string, string> = {
    bebida: '🧃', refresco: '🥤', café: '☕', cafe: '☕', agua: '💧',
    pizza: '🍕', hamburguesa: '🍔', papa: '🍟', frita: '🍟',
    ensalada: '🥗', verde: '🥬', postre: '🍰', pastel: '🍰', torta: '🍰',
    helado: '🍦', extra: '🌮', salsa: '🌯', té: '🧋', te: '🧋',
    carne: '🥩', queso: '🧀', empanada: '🥟', sandwich: '🥪', pan: '🥨',
    vino: '🍷', cerveza: '🍺', combo: '💥', desayuno: '🌅', almuerzo: '☀️',
    cena: '🌙', infantil: '🧒', vegetariano: '🥦', vegano: '🌱',
  }
  const lower = nombre.toLowerCase()
  for (const [key, icono] of Object.entries(mapa)) {
    if (lower.includes(key)) return icono
  }
  let hash = 0
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
  }
  return DEFAULT_ICONS[Math.abs(hash) % DEFAULT_ICONS.length]
}

function flattenAllCategories(items: Categoria[]): Categoria[] {
  const result: Categoria[] = []
  for (const item of items) {
    result.push(item)
    if (item.hijos?.length) {
      result.push(...flattenAllCategories(item.hijos))
    }
  }
  return result
}

function getAncestorChain(items: Categoria[], id: string | null | undefined): Categoria[] {
  if (!id) return []
  for (const c of items) {
    if (c.id === id) return [c]
    if (c.hijos?.length) {
      const found = getAncestorChain(c.hijos, id)
      if (found.length) return [c, ...found]
    }
  }
  return []
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

const imgAbs = (url: string) =>
  url.startsWith('/') ? `${apiBase}${url}` : url

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
  })

  const { data: categoriasData, isLoading: catLoading } = useQuery({
    queryKey: ['categorias-arbol'],
    queryFn: () => listarCategorias(true),
    ...queryDefaults('categorias'),
  })

  const allCategoriesPlanas = useMemo(() => categoriasData ? flattenAllCategories(categoriasData) : [], [categoriasData])

  // ─── Navigation State (IDs only, children derived from fresh categoriasData) ───
  const [navStack, setNavStack] = useState<(string | null)[]>([null])
  const currentNavId = navStack[navStack.length - 1]
  const isRoot = currentNavId === null

  const currentCategories = useMemo(() => {
    if (!categoriasData) return []
    if (currentNavId === null) return categoriasData.filter(c => c.activo !== false)
    const found = findCategoria(categoriasData, currentNavId)
    return found?.hijos?.filter(c => c.activo !== false) ?? []
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
    queryFn: () => listarProductos(catActivaId ? { categoria_id: catActivaId } : {}),
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

  const abrirNuevaCat = (parentId?: string) => {
    if (parentId && categoriasData) {
      const chain = getAncestorChain(categoriasData, parentId)
      setCatNivel1(chain[0]?.id ?? '')
      setCatNivel2(chain[1]?.id ?? '')
    } else {
      setCatNivel1('')
      setCatNivel2('')
    }
    const defIcono = parentId
      ? iconoPorDefecto(allCategoriesPlanas.find(c => c.id === parentId)?.nombre ?? '')
      : ''
    setCatEditando(null)
    setCatForm({ nombre: '', icono: defIcono })
    setCatPanelOpen(true)
  }

  const abrirEditarCat = (item: Categoria) => {
    const chain = categoriasData ? getAncestorChain(categoriasData, item.parent_id) : []
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
      const getLevel = (id: string, lvl = 0): number => {
        const c = allCategoriesPlanas.find(x => x.id === id)
        if (!c?.parent_id) return lvl
        return getLevel(c.parent_id, lvl + 1)
      }
      const parentLevel = getLevel(catParentId) + 1
      if (parentLevel >= 3) {
        showToast({ type: 'error', message: 'Máximo 3 niveles de categorías. El padre seleccionado ya está en el nivel máximo.' })
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
      queryClient.setQueryData(['productos', prodEditando?.id ?? ''], producto)
      showToast({ type: 'success', message: 'Imagen subida' })
      setSubiendoImg(false)
    },
    onError: () => {
      setSubiendoImg(false)
      showToast({ type: 'error', message: 'Error al subir imagen' })
    },
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
    } catch {
      showToast({ type: 'error', message: 'Error al cambiar estado' })
    }
  }, [queryClient, showToast])

  const abrirNuevoProd = () => {
    setProdEditando(null)
    setProdForm({
      nombre: '', descripcion: '', precio: 0, categoria_id: catActivaId ?? '',
      codigo: '', imagen_url: '', orden: 0, activo: true,
    })
    setProdModalOpen(true)
  }

  const abrirEditarProd = (p: Producto) => {
    setProdEditando(p)
    setProdForm({
      nombre: p.nombre, descripcion: p.descripcion ?? '', precio: p.precio,
      categoria_id: p.categoria_id ?? '', codigo: p.codigo ?? '',
      imagen_url: p.imagen_url ?? '', orden: p.orden ?? 0, activo: p.activo,
    })
    setProdModalOpen(true)
  }

  const cerrarProdModal = () => {
    setProdModalOpen(false)
    setProdEditando(null)
  }

  const guardarProd = () => {
    if (prodEditando) editarProdMutation.mutate()
    else crearProdMutation.mutate()
  }

  const productosFiltrados = useMemo(() => {
    if (!productos) return []
    if (!busqueda) return productos
    const q = busqueda.toLowerCase()
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q),
    )
  }, [productos, busqueda])

  const categoriasOptions = allCategoriesPlanas
    .filter((c) => c.activo)
    .map((c) => ({ value: c.id, label: c.nombre }))

  // ─── Navigation ───
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
    <div className="flex flex-col h-auto md:h-[calc(100vh-9rem)]">
      {/* ─── Navigation Bar ─── */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <button
          onClick={goBack}
          className={`size-9 rounded-xl border border-[#ede3db] bg-white flex items-center justify-center text-lg text-[#5a3d2b] cursor-pointer transition-all hover:bg-[#f5ede7] active:scale-95 ${navStack.length <= 1 ? 'invisible' : ''}`}
        >
          ←
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-[#2d241c] truncate">{currentNavName}</span>
          <span className="text-xs font-medium text-[#a0806e] bg-[#f5ede7] px-2 py-0.5 rounded-full shrink-0">
            {showProductLevel && productos ? productos.length : currentCategories.length}
          </span>
        </div>
      </div>

      {/* ─── Level Dots ─── */}
      <div className="flex items-center gap-1.5 mb-3 shrink-0">
        {navStack.map((_id, i) => {
          const isLast = i === navStack.length - 1
          return (
            <button
              key={i}
              onClick={i < navStack.length - 1 ? () => setNavStack(prev => prev.slice(0, i + 1)) : undefined}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${isLast ? 'w-5 bg-[#c66a1e]' : 'w-1.5 bg-[#d99a5b] hover:bg-[#c66a1e]'}`}
            />
          )
        })}
      </div>

      {/* ─── Search (product level only) ─── */}
      {showProductLevel && (
        <div className="flex items-center gap-2 bg-[#f5efe9] rounded-[14px] px-3 py-2 mb-3 border border-transparent focus-within:border-[#c66a1e] focus-within:bg-white transition-all shrink-0">
          <svg className="size-4 text-[#b8a292] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-[#2d241c] placeholder:text-[#b8a292]"
          />
        </div>
      )}

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Category Cards Level */}
        {!showProductLevel && (
          <>
            {isRoot && currentCategories.length > 0 && (
              <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-[#a0806e] mb-2.5">
                Categorías
              </div>
            )}

            {currentCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-1 text-[#b8a292]">
                <FolderTree className="size-8 text-[#b8a292] mb-1" />
                <span className="font-semibold text-sm text-[#7a5e4a]">Sin subcategorías</span>
                <span className="text-xs">Crea una categoría para organizar productos</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentCategories.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => navigateTo(cat)}
                    className="group relative bg-white border border-[#ede3db] rounded-[18px] p-4 cursor-pointer flex flex-col items-center text-center gap-2 transition-all hover:border-[#c66a1e] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(198,106,30,0.12)] active:scale-[0.97]"
                    style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both` }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); abrirEditarCat(cat) }}
                      className="absolute top-2 right-2 size-6 rounded-full bg-white/80 border border-[#ede3db] flex items-center justify-center text-xs text-[#a0806e] opacity-0 group-hover:opacity-100 hover:text-[#c66a1e] hover:border-[#c66a1e] transition-all cursor-pointer"
                      title="Editar categoría"
                    >
                      ✎
                    </button>
                    <div className="size-11 rounded-[16px] bg-gradient-to-br from-[#fff8f0] to-[#ffedd5] flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
                      {cat.icono || iconoPorDefecto(cat.nombre)}
                    </div>
                    <span className="font-semibold text-sm text-[#2d241c] leading-tight">{cat.nombre}</span>
                    <span className="text-[0.65rem] font-medium text-[#a0806e] bg-[#faf3ed] px-2 py-0.5 rounded-full">
                      {cat.hijos ? cat.hijos.filter(p => p.activo !== false).length : 0} subcategorías
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* New category button */}
            <div className="flex justify-center mt-5">
              <button
                onClick={() => abrirNuevaCat(catActivaId ?? undefined)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border-none bg-gradient-to-r from-[#b86119] to-[#d88625] text-white text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(184,97,25,0.4)] active:scale-[0.97] shadow-[0_4px_12px_rgba(184,97,25,0.3)]"
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
                <span className="text-4xl">⚠️</span>
                <p className="text-[#cf5c5c] text-sm">{error.message}</p>
                <Button size="sm" onClick={() => refetch()}>Reintentar</Button>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-1 text-[#b8a292]">
                <Package className="size-8 text-[#b8a292] mb-1" />
                <span className="font-semibold text-sm text-[#7a5e4a]">Sin productos</span>
                <span className="text-xs">Agrega productos a esta categoría</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-[22px]">
                {productosFiltrados.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => abrirEditarProd(p)}
                    className="w-full rounded-[18px] border-2 border-[--color-menu-card-border] bg-white overflow-hidden flex flex-col cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    style={{ height: '255px', animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both` }}
                  >
                    <div className="h-[110px] bg-gradient-to-b from-[#FDF3E8] to-[#F8E6CF] flex items-center justify-center shrink-0 rounded-t-[16px] overflow-hidden">
                      {p.imagen_url ? (
                        <img src={imgAbs(p.imagen_url)} alt={p.nombre} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <svg className="w-[70px] h-[70px] text-[#C47620]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center px-3 py-2 gap-1.5">
                      <span className="text-[22px] font-bold text-[#1D1D1D] text-center leading-tight truncate w-full">
                        {p.nombre}
                      </span>
                      <span className="h-7 px-3 bg-gradient-to-r from-[#b86119] to-[#d88625] text-white text-base font-semibold rounded-full flex items-center justify-center">
                        ${p.precio.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t border-[#E7E7E7] px-3 py-2 flex items-center justify-between shrink-0">
                      <span className="text-xs text-[--color-menu-text-muted]">
                        {p.codigo || '—'}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Toggle
                          checked={p.activo}
                          onChange={() => toggleProductoActivo(p)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New product button */}
            <div className="flex justify-center mt-5">
              <button
                onClick={abrirNuevoProd}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border-none bg-gradient-to-r from-[#b86119] to-[#d88625] text-white text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(184,97,25,0.4)] active:scale-[0.97] shadow-[0_4px_12px_rgba(184,97,25,0.3)]"
              >
                + Agregar Producto
              </button>
            </div>
          </>
        )}

        {/* Root "all products" quick access */}
        {isRoot && categoriasData && categoriasData.length > 0 && !showAllProducts && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => {
                setNavStack(prev => [...prev, 'todos'])
              }}
              className="text-xs font-medium text-[#b36a24] hover:underline cursor-pointer"
            >
              Ver todos los productos →
            </button>
          </div>
        )}
      </div>

      {/* ─── SidePanel de Categoría ─── */}
      <SidePanel open={catPanelOpen} onClose={cerrarPanelCat} title={catEditando ? 'Editar Categoría' : 'Nueva Categoría'}>
        <div className="flex flex-col gap-4">
          {/* Nombre */}
          <Input
            label="Nombre"
            value={catForm.nombre}
            onChange={(e) => setCatForm({ ...catForm, nombre: e.target.value })}
            required
            autoFocus
          />

          {/* Cascading selects for parent category */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-[#7a6b5d] uppercase tracking-wider">Categoría padre</label>

            <Select
              label="Nivel 1 — Categoría principal"
              options={catOptionsNivel1}
              value={catNivel1}
              onValueChange={(v) => { setCatNivel1(v); setCatNivel2('') }}
              placeholder="— Raíz —"
            />

            {catNivel1 && (
              <Select
                label="Nivel 2 — Subcategoría"
                options={catOptionsNivel2}
                value={catNivel2}
                onValueChange={(v) => setCatNivel2(v)}
                placeholder="— Ninguna —"
              />
            )}
          </div>

          {/* Emoji grid selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#7a6b5d] uppercase tracking-wider">Icono</label>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">{catForm.icono || iconoPorDefecto(catForm.nombre || '')}</span>
              {catForm.icono && (
                <button
                  onClick={() => setCatForm({ ...catForm, icono: '' })}
                  className="text-xs text-[#a0806e] hover:text-[#cf5c5c] transition-colors cursor-pointer"
                >
                  Quitar
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-2 rounded-[10px] border border-[#ede3db] bg-white">
              {FOOD_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setCatForm({ ...catForm, icono: emoji === catForm.icono ? '' : emoji })}
                  className={`size-8 flex items-center justify-center text-xl rounded-lg transition-all cursor-pointer ${
                    catForm.icono === emoji
                      ? 'bg-[#c66a1e] text-white scale-110 shadow-md'
                      : 'hover:bg-[#ffedd5] hover:scale-110'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={guardarCat}
              loading={crearCatMutation.isPending || editarCatMutation.isPending}
            >
              {catEditando ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
            {catEditando && (
              <Button variant="danger" onClick={() => setConfirmDelete(catEditando)}>
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar categoría"
        message={`¿Desactivar "${confirmDelete?.nombre}"? Los productos asociados pasarán a sin categoría.`}
        confirmLabel="Desactivar"
        onConfirm={() => eliminarCatMutation.mutate()}
        onCancel={() => setConfirmDelete(null)}
        loading={eliminarCatMutation.isPending}
      />

      {/* ─── Modal de Producto ─── */}
      {prodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={cerrarProdModal} />
          <div className="relative bg-white rounded-[18px] shadow-[0_16px_35px_rgba(0,0,0,0.22)] overflow-hidden w-[95vw] sm:max-w-md mx-4">
            <div className="h-[34px] bg-gradient-to-r from-[#b86119] to-[#d88625] flex items-center px-4">
              <span className="text-white text-base font-semibold">
                {prodEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </span>
            </div>

            <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <Input label="Nombre" value={prodForm.nombre} onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })} required />
              <Input label="Descripción" value={prodForm.descripcion} onChange={(e) => setProdForm({ ...prodForm, descripcion: e.target.value })} />
              <Input label="Precio" type="number" step="0.01" value={prodForm.precio} onChange={(e) => setProdForm({ ...prodForm, precio: parseFloat(e.target.value || '0') })} />

              <Select
                label="Categoría"
                options={categoriasOptions}
                value={prodForm.categoria_id}
                onValueChange={(v) => setProdForm({ ...prodForm, categoria_id: v })}
                placeholder="Sin categoría"
              />

              <Input label="Código de barras" value={prodForm.codigo} onChange={(e) => setProdForm({ ...prodForm, codigo: e.target.value })} placeholder="Opcional" />

              {/* ── Imagen ── */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[#7a6b5d]">Imagen</label>

                {prodForm.imagen_url && (
                  <div className="relative w-full h-28 rounded-[10px] overflow-hidden border border-[#e6ddd4] mb-1">
                    <img
                      src={imgAbs(prodForm.imagen_url)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {prodEditando && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoImg}
                        className="flex-1 h-8 text-xs font-medium rounded-full border border-[--color-menu-accent] text-[--color-menu-accent] bg-transparent hover:bg-[--color-menu-accent] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {subiendoImg ? 'Subiendo...' : prodForm.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
                      </button>
                    </>
                  )}

                  {prodForm.imagen_url && prodEditando && (
                    <button
                      type="button"
                      onClick={() => eliminarImgMutation.mutate()}
                      disabled={eliminarImgMutation.isPending}
                      className="h-8 px-4 text-xs font-medium rounded-full border border-[#cf5c5c] text-[#cf5c5c] bg-transparent hover:bg-[#cf5c5c] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {eliminarImgMutation.isPending ? '...' : 'Eliminar'}
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="O pega una URL..."
                  value={prodForm.imagen_url}
                  onChange={(e) => setProdForm({ ...prodForm, imagen_url: e.target.value })}
                  className="w-full h-7 px-3 rounded-[10px] border border-[--color-menu-input-border] text-xs text-[--color-menu-text] placeholder:text-[--color-menu-text-muted] outline-none focus:border-[--color-menu-accent] transition-colors"
                />
              </div>

              {prodEditando && (
                <Toggle checked={prodForm.activo} onChange={(v) => setProdForm({ ...prodForm, activo: v })} label="Producto activo" />
              )}

              <button
                onClick={guardarProd}
                disabled={!prodForm.nombre || crearProdMutation.isPending || editarProdMutation.isPending}
                className="w-full h-[34px] bg-gradient-to-r from-[#b86119] to-[#d88625] text-white text-sm font-semibold rounded-full shadow-[0_4px_10px_rgba(190,110,30,0.20)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              >
                {crearProdMutation.isPending || editarProdMutation.isPending ? 'Guardando...' : prodEditando ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
