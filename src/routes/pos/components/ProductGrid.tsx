import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { getProductos, getCategorias } from '../api'
import { ProductCard } from '../../../components/shared/ProductCard'
import { Chip } from '../../../components/ui/Chip'
import { SearchInput } from '../../../components/shared/SearchInput'
import type { Producto } from '../../../types'

interface ProductGridProps {
  onSelectProducto: (p: Producto) => void
  onLongPressProducto?: (p: Producto) => void
}

export function ProductGrid({ onSelectProducto, onLongPressProducto }: ProductGridProps) {
  const [categoriaActiva, setCategoriaActiva] = useState<string | undefined>(undefined)
  const [busqueda, setBusqueda] = useState('')

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
    ...queryDefaults('categorias'),
  })

  const { data: productos } = useQuery({
    queryKey: ['productos', categoriaActiva],
    queryFn: () => getProductos(categoriaActiva),
    ...queryDefaults('productos'),
  })

  const filtrados = (productos ?? []).filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-3 h-full">
      <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />

      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        <Chip
          active={!categoriaActiva}
          onClick={() => setCategoriaActiva(undefined)}
        >
          Todas
        </Chip>
        {categorias?.filter(c => c.activo).map((cat) => (
          <Chip
            key={cat.id}
            active={categoriaActiva === cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
          >
            {cat.nombre}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-2 overflow-y-auto pb-2">
        {filtrados.map((p) => (
          <ProductCard
            key={p.id}
            producto={p}
            onSelect={onSelectProducto}
            onLongPress={onLongPressProducto}
          />
        ))}
      </div>
    </div>
  )
}
