import { useQuery } from '@tanstack/react-query'
import { getMesas, getOrdenes } from '../api'
import type { Mesa } from '../../../types'

interface TableMapProps {
  onSelectMesa: (mesa: Mesa) => void
}

export function TableMap({ onSelectMesa }: TableMapProps) {
  const { data: mesas, isLoading } = useQuery({
    queryKey: ['mesas'],
    queryFn: getMesas,
    staleTime: 60_000,
  })

  const { data: ordenes } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => getOrdenes(),
    staleTime: 30_000,
  })

  const mesasOcupadas = new Set(
    ordenes?.filter((o) => o.estado !== 'pagada').map((o) => o.mesa_id) ?? []
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-bg-surface animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {mesas?.map((mesa) => {
        const ocupada = mesasOcupadas.has(mesa.id)
        return (
          <button
            key={mesa.id}
            onClick={() => onSelectMesa(mesa)}
            className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-95 ${
              ocupada
                ? 'bg-accent/10 border-accent/50 text-accent glow-amber'
                : 'bg-bg-surface border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
            }`}
          >
            <span className={`font-display text-lg ${ocupada ? 'text-accent' : ''}`}>
              {mesa.numero}
            </span>
            <span className="text-[10px] font-body text-text-secondary">
              {mesa.capacidad} p.
            </span>
            {ocupada && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            )}
          </button>
        )
      })}
    </div>
  )
}
