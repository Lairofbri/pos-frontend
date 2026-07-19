import { useRef, useState } from 'react'
import type { Producto } from '../../types'

interface ProductCardProps {
  producto: Producto
  onSelect: (p: Producto) => void
  onLongPress?: (p: Producto) => void
  selected?: boolean
  variant?: 'sm' | 'lg'
}

const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/api$/, '')

const imgAbs = (url?: string) =>
  url ? (url.startsWith('/') ? `${apiBase}${url}` : url) : ''

function hashColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hues = ['#D9734E', '#F0A98C', '#4A9D6E', '#5B8EBF', '#CF5C5C', '#D9A05B', '#B85C3B', '#7A6B5D']
  return hues[Math.abs(hash) % hues.length]
}

export function ProductCard({
  producto,
  onSelect,
  onLongPress,
  selected = false,
  variant = 'sm',
}: ProductCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPress = useRef(false)
  const [ripples, setRipples] = useState<
    { x: number; y: number; id: number }[]
  >([])
  const [imgError, setImgError] = useState(false)

  const triggerHaptic = (type: 'light' | 'medium' = 'light') => {
    if (navigator.vibrate) {
      navigator.vibrate(type === 'light' ? 10 : 30)
    }
  }

  const createRipple = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientX =
      'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY =
      'touches' in e ? e.touches[0].clientY : e.clientY
    const x = clientX - rect.left
    const y = clientY - rect.top
    const id = Date.now()
    setRipples((prev) => [...prev, { x, y, id }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 500)
  }

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    isLongPress.current = false
    createRipple(e)
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      triggerHaptic('medium')
      onLongPress?.(producto)
    }, 600)
  }

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleClick = () => {
    if (!isLongPress.current) {
      triggerHaptic('light')
      onSelect(producto)
    }
  }

  const showImage = producto.imagen_url && !imgError
  const bgColor = hashColor(producto.categoria_id ?? producto.id)

  if (variant === 'lg') {
    return (
      <button
        onClick={handleClick}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerCancel={handlePressEnd}
        className={`relative overflow-hidden flex flex-col rounded-[18px] border-2 transition-all duration-200 cursor-pointer animate-fadeIn
          ${
            selected
          ? 'bg-pos-accent/10 border-pos-accent scale-[0.98]'
              : 'bg-white border-pos-border hover:border-pos-accent hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(198,106,30,0.12)] active:scale-[0.97]'
          }
        `}
      >
        <span className="absolute inset-0 pointer-events-none z-10">
          {ripples.map((r) => (
            <span
              key={r.id}
              className="absolute bg-white/30 rounded-full animate-ripple"
              style={{
                left: r.x,
                top: r.y,
                width: 120,
                height: 120,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </span>

        {/* Image area */}
        <div className="h-[110px] bg-gradient-to-b from-[#FDF3E8] to-[#F8E6CF] flex items-center justify-center shrink-0 rounded-t-[16px] overflow-hidden">
          {showImage ? (
            <img
              src={imgAbs(producto.imagen_url)}
              alt={producto.nombre}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white/80 text-4xl font-display"
              style={{ backgroundColor: bgColor }}
            >
              {producto.nombre.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="flex-1 flex flex-col items-center justify-center px-3 py-2 gap-1.5">
          <span className="text-[15px] font-bold text-pos-text text-center leading-tight line-clamp-2">
            {producto.nombre}
          </span>
          <span className="h-7 px-3 bg-gradient-to-r from-[#b86119] to-[#d88625] text-white text-sm font-semibold rounded-full flex items-center justify-center">
            ${producto.precio?.toFixed(2) ?? '0.00'}
          </span>
        </div>

        {selected && (
          <span className="absolute top-2 right-2 text-pos-accent text-sm z-20 bg-white/80 rounded-full w-6 h-6 flex items-center justify-center">✓</span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerCancel={handlePressEnd}
      className={`relative overflow-hidden flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 min-h-[88px] animate-fadeIn
        ${
          selected
            ? 'bg-pos-accent/10 border-pos-accent scale-[0.98]'
            : 'bg-bg-surface border-border hover:border-pos-accent hover:glow-pos active:scale-[0.97]'
        }
      `}
    >
      <span className="absolute inset-0 pointer-events-none">
        {ripples.map((r) => (
          <span
            key={r.id}
            className="absolute bg-white/30 rounded-full animate-ripple"
            style={{
              left: r.x,
              top: r.y,
              width: 120,
              height: 120,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </span>

      {showImage ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <img
            src={imgAbs(producto.imagen_url)}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white/80 text-lg font-display"
          style={{ backgroundColor: bgColor }}
        >
          {producto.nombre.charAt(0).toUpperCase()}
        </div>
      )}

      <span className="text-xs font-body font-medium text-text-primary text-center leading-tight line-clamp-2">
        {producto.nombre}
      </span>

      <span className="text-xs font-mono text-pos-accent font-semibold">
        ${producto.precio?.toFixed(2) ?? '0.00'}
      </span>

      {selected && (
        <span className="absolute top-1 right-1 text-pos-accent text-xs">✓</span>
      )}
    </button>
  )
}

