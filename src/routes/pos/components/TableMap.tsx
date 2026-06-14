import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { getMesas, getOrdenes } from '../api'
import { useZoneStore } from '../../../store/zoneStore'
import { useCatalogo } from '../../../hooks/useCatalogo'
import type { Mesa } from '../../../types'

interface TableMapProps {
  onSelectMesa: (mesa: Mesa) => void
}

export function TableMap({ onSelectMesa }: TableMapProps) {
  const zonaActiva = useZoneStore((s) => s.zona)
  const { data: zonas } = useCatalogo('zonas')

  const zonaLabels: Record<string, string> = useMemo(
    () => Object.fromEntries((zonas ?? []).map((z) => [z.valor, z.label])),
    [zonas]
  )

  const { data: mesas, isLoading } = useQuery({
    queryKey: ['mesas'],
    queryFn: getMesas,
    ...queryDefaults('mesas'),
  })

  const { data: ordenes } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => getOrdenes(),
    ...queryDefaults('ordenes'),
  })

  const mesasOcupadas = useMemo(
    () => new Set(ordenes?.filter((o) => o.estado !== 'pagada' && o.estado !== 'cancelada').map((o) => o.mesa_id) ?? []),
    [ordenes]
  )

  const mesasFiltradas = useMemo(
    () => (mesas ?? []).filter((m) => m.zona === zonaActiva && m.activo),
    [mesas, zonaActiva]
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-bg-surface animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm text-text-secondary uppercase tracking-wider">
          {zonaLabels[zonaActiva] ?? zonaActiva}
        </h2>
        <span className="text-xs font-mono text-text-secondary">
          {mesasFiltradas.filter((m) => !mesasOcupadas.has(m.id)).length} libres
        </span>
      </div>

      {mesasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl">🪑</span>
          <p className="text-text-secondary text-sm font-body">No hay mesas en esta zona</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {mesasFiltradas.map((mesa, i) => {
            const ocupada = mesasOcupadas.has(mesa.id)
            return (
              <button
                key={mesa.id}
                onClick={() => onSelectMesa(mesa)}
                className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-95 animate-fadeIn ${
                  ocupada
                    ? 'bg-accent/10 border-accent/50 text-accent glow-amber'
                    : 'bg-bg-surface border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
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
      )}
    </div>
  )
}
