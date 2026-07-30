import { useState, useMemo } from 'react'
import { FolderTree } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { listarArbolCategorias } from '../../api/categorias'
import { Icon } from './Icon'
import { Spinner } from '@/components/ui/Spinner'
import type { Categoria } from '../../types'

interface CategoryNavigatorProps {
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptySubtitle?: string
  onSelect?: (categoriaId: string | null) => void
  onNewCategory?: (parentId?: string) => void
  onEditCategory?: (cat: Categoria) => void
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

export function CategoryNavigator({
  emptyIcon,
  emptyTitle = 'Sin categorías',
  emptySubtitle = 'Crea una categoría para organizar',
  onSelect,
  onNewCategory,
  onEditCategory,
}: CategoryNavigatorProps) {
  const { data: categoriasData, isLoading: catLoading, error } = useQuery({
    queryKey: ['categorias-arbol'],
    queryFn: () => listarArbolCategorias(),
    ...queryDefaults('categorias'),
  })

  const [navStack, setNavStack] = useState<(string | null)[]>([null])
  const currentNavId = navStack[navStack.length - 1]

  const currentCategories = useMemo(() => {
    if (!categoriasData) return []
    if (currentNavId === null) return categoriasData.filter(c => c.activo !== false)
    const found = findCategoria(categoriasData, currentNavId)
    return found?.hijos?.filter(c => c.activo !== false) ?? []
  }, [categoriasData, currentNavId])

  const currentNavName = useMemo(() => {
    if (currentNavId === null) return 'Categorías'
    const found = findCategoria(categoriasData ?? [], currentNavId)
    return found?.nombre ?? 'Todos'
  }, [categoriasData, currentNavId])

  const isRoot = currentNavId === null

  const navigateTo = (cat: Categoria) => {
    setNavStack(prev => [...prev, cat.id])
    onSelect?.(cat.id)
  }

  const goBack = () => {
    if (navStack.length <= 1) return
    const newStack = navStack.slice(0, -1)
    const parentId = newStack[newStack.length - 1]
    setNavStack(newStack)
    onSelect?.(parentId)
  }

  const goHome = () => {
    setNavStack([null])
    onSelect?.(null)
  }

  const showAll = () => {
    setNavStack(prev => [...prev, 'todos'])
    onSelect?.(null)
  }

  if (catLoading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-secondary">
        <Icon name="alert" className="size-8" />
        <span className="text-sm">Error al cargar categorías</span>
      </div>
    )
  }

  return (
    <>
      {/* Navigation Bar */}
      {navStack.length > 1 && (
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <button
            onClick={goBack}
            className="size-9 rounded-xl border border-border bg-white flex items-center justify-center text-text-primary cursor-pointer transition-all hover:bg-bg-surface active:scale-95"
          >
            <Icon name="arrow-left" className="size-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-text-primary truncate">{currentNavName}</span>
            <span className="text-xs font-medium text-text-secondary bg-bg-surface px-2 py-0.5 rounded-full shrink-0">
              {currentCategories.length}
            </span>
          </div>
        </div>
      )}

      {/* Level Dots */}
      <div className="flex items-center gap-1.5 mb-3 shrink-0">
        <button
          onClick={goHome}
          className={`h-1.5 rounded-full transition-all cursor-pointer ${
            navStack.length === 1 ? 'w-5 bg-accent' : 'w-1.5 bg-accent/40 hover:bg-accent'
          }`}
        />
        {navStack.slice(1).map((_id, i) => {
          const isLast = i === navStack.length - 2
          return (
            <button
              key={i}
              onClick={!isLast ? () => setNavStack(prev => prev.slice(0, i + 2)) : undefined}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                isLast ? 'w-5 bg-accent' : 'w-1.5 bg-accent/40 hover:bg-accent'
              }`}
            />
          )
        })}
      </div>

      {/* Category Cards Level */}
      {currentCategories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          {currentCategories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => navigateTo(cat)}
              className="group relative bg-white border border-border rounded-xl p-4 cursor-pointer flex flex-col items-center text-center gap-2 transition-all hover:border-accent hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(198,106,30,0.12)] active:scale-[0.97]"
              style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both` }}
            >
              {onEditCategory && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEditCategory(cat) }}
                  className="absolute top-2 right-2 size-6 rounded-full bg-white/80 border border-border flex items-center justify-center text-text-secondary opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent transition-all cursor-pointer"
                  title="Editar categoría"
                >
                  <Icon name="edit" className="size-3.5" />
                </button>
              )}
              <div className="size-11 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center transition-transform group-hover:scale-110">
                {cat.icono ? <Icon name={cat.icono} className="size-6" /> : <FolderTree className="size-6 text-accent" />}
              </div>
              <span className="font-semibold text-sm text-text-primary leading-tight">{cat.nombre}</span>
              <span className="text-xs font-medium text-text-secondary bg-bg-surface px-2 py-0.5 rounded-full">
                {cat.hijos ? cat.hijos.filter(c => c.activo !== false).length : 0} subcategorías
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state (root level) */}
      {isRoot && currentCategories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-1 text-text-secondary">
          {emptyIcon || <FolderTree className="size-8 mb-1" />}
          <span className="font-semibold text-sm text-text-primary">{emptyTitle}</span>
          <span className="text-xs">{emptySubtitle}</span>
        </div>
      )}

      {/* New Category Button */}
      {isRoot && (
        <div className="flex justify-center mt-2 mb-4">
          <button
            onClick={() => onNewCategory?.()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-accent-dark to-accent text-white text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(184,97,25,0.4)] active:scale-[0.97] shadow-[0_4px_12px_rgba(184,97,25,0.3)]"
          >
            + Nueva Categoría
          </button>
        </div>
      )}

      {/* View all link */}
      {isRoot && categoriasData && categoriasData.length > 0 && (
        <div className="flex justify-center mt-1 mb-3">
          <button
            onClick={showAll}
            className="text-xs font-medium text-accent-dark hover:underline cursor-pointer"
          >
            Ver todos los elementos →
          </button>
        </div>
      )}
    </>
  )
}
