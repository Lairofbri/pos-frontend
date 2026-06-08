import type { Producto } from '../../types'

interface ProductCardProps {
  producto: Producto
  onSelect: (p: Producto) => void
  onLongPress?: (p: Producto) => void
}

export function ProductCard({ producto, onSelect, onLongPress }: ProductCardProps) {
  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  const handleTouchStart = () => {
    longPressTimer = setTimeout(() => {
      onLongPress?.(producto)
    }, 600)
  }

  const handleTouchEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer)
  }

  return (
    <button
      onClick={() => onSelect(producto)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className="relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-bg-surface border-2 border-border hover:border-accent hover:glow-amber transition-all duration-200 cursor-pointer active:scale-[0.97] min-h-[88px]"
    >
      <span className="text-2xl">🍽️</span>
      <span className="text-xs font-body font-medium text-text-primary text-center leading-tight line-clamp-2">
        {producto.nombre}
      </span>
      <span className="text-xs font-mono text-accent font-semibold">
        ${producto.precio.toFixed(2)}
      </span>
    </button>
  )
}
