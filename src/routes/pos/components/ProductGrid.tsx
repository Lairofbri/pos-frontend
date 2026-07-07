import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { getProductos, getCategorias } from '../api'
import { ProductCard } from '../../../components/shared/ProductCard'
import type { Producto, Categoria } from '../../../types'

interface ProductGridProps {
  onSelectProducto: (p: Producto) => void
  onLongPressProducto?: (p: Producto) => void
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

const DEFAULT_ICONS = ['📦', '⭐', '🔵', '🟢', '🟡', '🟠', '🔴', '🟣', '💠', '🔶', '🔷', '🟩', '🟥', '🟨', '⬜', '⬛']

const iconoPorDefecto = (nombre: string): string => {
  const mapa: Record<string, string> = {
    bebida: '🧃', refresco: '🥤', café: '☕', cafe: '☕', agua: '💧',
    pizza: '🍕', hamburguesa: '🍔', papa: '🍟', frita: '🍟',
    ensalada: '🥗', postre: '🍰', pastel: '🍰',
    helado: '🍦', extra: '🌮', salsa: '🌯', té: '🧋', te: '🧋',
    carne: '🥩', queso: '🧀', empanada: '🥟', sandwich: '🥪', pan: '🥨',
    vino: '🍷', cerveza: '🍺', combo: '💥', desayuno: '🌅', almuerzo: '☀️',
    cena: '🌙',
  }
  const lower = nombre.toLowerCase()
  for (const [key, icon] of Object.entries(mapa)) {
    if (lower.includes(key)) return icon
  }
  let hash = 0
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
  }
  return DEFAULT_ICONS[Math.abs(hash) % DEFAULT_ICONS.length]
}

export function ProductGrid({ onSelectProducto, onLongPressProducto }: ProductGridProps) {
  const [busqueda, setBusqueda] = useState('')
  const [navStack, setNavStack] = useState<(string | null)[]>([null])
  const currentNavId = navStack[navStack.length - 1]

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-arbol'],
    queryFn: () => getCategorias(true),
    ...queryDefaults('categorias'),
  })

  const currentCategories = useMemo(() => {
    if (!categoriasData) return []
    if (currentNavId === null) return categoriasData.filter(c => c.activo !== false)
    const found = findCategoria(categoriasData, currentNavId)
    return found?.hijos?.filter(c => c.activo !== false) ?? []
  }, [categoriasData, currentNavId])

  const isRoot = currentNavId === null
  const isLeaf = currentCategories.length === 0
  const showProductLevel = isLeaf && currentNavId !== null

  const { data: productos } = useQuery({
    queryKey: ['productos', currentNavId],
    queryFn: () => getProductos(currentNavId ?? undefined),
    enabled: showProductLevel,
    ...queryDefaults('productos'),
  })

  const filtrados = (productos ?? []).filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const currentNavName = useMemo(() => {
    if (currentNavId === null) return 'Categorías'
    const found = findCategoria(categoriasData ?? [], currentNavId)
    return found?.nombre ?? ''
  }, [categoriasData, currentNavId])

  const navigateTo = (cat: Categoria) => setNavStack(prev => [...prev, cat.id])

  const goBack = () => {
    if (navStack.length > 1) setNavStack(prev => prev.slice(0, -1))
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Navigation bar */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={goBack}
          className={`w-9 h-9 rounded-xl border border-[#ede3db] bg-white flex items-center justify-center text-lg text-[#5a3d2b] cursor-pointer transition-all hover:bg-[#f5ede7] active:scale-95 ${navStack.length <= 1 ? 'invisible' : ''}`}
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

      {/* Level dots */}
      {!isRoot && (
        <div className="flex items-center gap-1.5 shrink-0">
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
      )}

      {/* Search (product level only) */}
      {showProductLevel && (
        <div className="flex items-center gap-2 bg-[#f5efe9] rounded-[14px] px-3 py-2 border border-transparent focus-within:border-[#c66a1e] focus-within:bg-white transition-all shrink-0">
          <svg className="w-4 h-4 text-[#b8a292] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-2 scrollbar-thin">
        {/* Category cards */}
        {!showProductLevel && (
          <>
            {isRoot && currentCategories.length > 0 && (
              <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-[#a0806e] mb-2.5">
                Categorías
              </div>
            )}

            {currentCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-1 text-[#b8a292]">
                <span className="text-3xl mb-1">📂</span>
                <span className="font-semibold text-sm text-[#7a5e4a]">Sin subcategorías</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentCategories.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => navigateTo(cat)}
                    className="group relative bg-white border border-[#ede3db] rounded-[18px] p-4 cursor-pointer flex flex-col items-center text-center gap-2 transition-all hover:border-[#c66a1e] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(198,106,30,0.12)] active:scale-[0.97]"
                    style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both` }}
                  >
                    <div className="w-11 h-11 rounded-[16px] bg-gradient-to-br from-[#fff8f0] to-[#ffedd5] flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
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
          </>
        )}

        {/* Products level */}
        {showProductLevel && (
          <>
            {filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-1 text-[#b8a292]">
                <span className="text-3xl mb-1">📦</span>
                <span className="font-semibold text-sm text-[#7a5e4a]">Sin productos</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtrados.map((p) => (
                  <ProductCard
                    key={p.id}
                    producto={p}
                    variant="lg"
                    onSelect={onSelectProducto}
                    onLongPress={onLongPressProducto}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
