import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { getMesas, getOrdenes } from '../api'
import { useZoneStore } from '../../../store/zoneStore'
import { useCatalogo } from '../../../hooks/useCatalogo'
import type { Mesa, Orden } from '../../../types'

interface TableMapProps {
  onSelectMesa: (mesa: Mesa) => void
}

type MesaEstado = 'libre' | 'ocupada' | 'pendiente_pago' | 'reservada'

const STATUS_CONFIG: Record<MesaEstado, { label: string; border: string; bg: string; dot: string; text: string }> = {
  libre: {
    label: 'Libre',
    border: 'border-status-libre/30 group-hover:border-status-libre/60',
    bg: 'bg-status-libre/10',
    dot: 'bg-status-libre',
    text: 'text-status-libre',
  },
  ocupada: {
    label: 'Ocupada',
    border: 'border-status-ocupada/30 group-hover:border-status-ocupada/60',
    bg: 'bg-status-ocupada/10',
    dot: 'bg-status-ocupada',
    text: 'text-status-ocupada',
  },
  pendiente_pago: {
    label: 'P/Pago',
    border: 'border-status-pendiente/40 group-hover:border-status-pendiente/70',
    bg: 'bg-status-pendiente/10',
    dot: 'bg-status-pendiente animate-pulse',
    text: 'text-status-pendiente',
  },
  reservada: {
    label: 'Reservada',
    border: 'border-status-reservada/30 group-hover:border-status-reservada/60',
    bg: 'bg-status-reservada/10',
    dot: 'bg-status-reservada',
    text: 'text-status-reservada',
  },
}

function formatTiempo(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function StatusBadge({ estado }: { estado: MesaEstado }) {
  const cfg = STATUS_CONFIG[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text} text-[10px] font-semibold uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function TableMap({ onSelectMesa }: TableMapProps) {
  const zonaActiva = useZoneStore((s) => s.zona)
  const { data: zonas } = useCatalogo('zonas')

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(() => Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

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

  const ordenPorMesa = useMemo(() => {
    const map = new Map<string, Orden>()
    if (!ordenes) return map
    for (const o of ordenes) {
      if (o.estado !== 'pagada' && o.estado !== 'cancelada' && !map.has(o.mesa_id)) {
        map.set(o.mesa_id, o)
      }
    }
    return map
  }, [ordenes])

  const mesasFiltradas = useMemo(
    () => (mesas ?? []).filter((m) => m.zona === zonaActiva && m.activo),
    [mesas, zonaActiva]
  )

  function getEstado(orden?: Orden): MesaEstado {
    if (!orden) return 'libre'
    if (orden.items.length > 0 && orden.items.every((i) => i.estado === 'listo')) {
      return 'pendiente_pago'
    }
    return 'ocupada'
  }

  const stats = useMemo(() => {
    let libres = 0; let ocupadas = 0; let pendientes = 0
    for (const mesa of mesasFiltradas) {
      const orden = ordenPorMesa.get(mesa.id)
      const estado = getEstado(orden)
      if (estado === 'libre') libres++
      else if (estado === 'pendiente_pago') pendientes++
      else ocupadas++
    }
    return { libres, ocupadas, pendientes, total: mesasFiltradas.length }
  }, [mesasFiltradas, ordenPorMesa])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-xl bg-bg-surface animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm text-text-secondary uppercase tracking-wider">
            {zonaLabels[zonaActiva] ?? zonaActiva}
          </h2>
          <div className="flex items-center gap-2 text-[11px] font-mono text-text-secondary">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-status-libre" />{stats.libres}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-status-ocupada" />{stats.ocupadas}</span>
            {stats.pendientes > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-status-pendiente animate-pulse" />{stats.pendientes}</span>}
          </div>
        </div>
        <span className="text-xs font-mono text-text-secondary">{stats.total} mesas</span>
      </div>

      {mesasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl">🪑</span>
          <p className="text-text-secondary text-sm font-body">No hay mesas en esta zona</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {mesasFiltradas.map((mesa, i) => {
            const orden = ordenPorMesa.get(mesa.id)
            const estado = getEstado(orden)
            const cfg = STATUS_CONFIG[estado]
            const elapsed = orden
              ? Math.floor((now - new Date(orden.created_at).getTime()) / 60000)
              : 0

            return (
              <button
                key={mesa.id}
                onClick={() => onSelectMesa(mesa)}
                className={`group aspect-[4/3] flex flex-col rounded-xl border-2 transition-all duration-200 ease-out cursor-pointer active:scale-[0.97] animate-fadeIn ${cfg.border} ${
                  estado === 'libre'
                    ? 'bg-bg-surface hover:bg-bg-surface-hover'
                    : `${cfg.bg}`
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex-1 flex flex-col p-3 gap-1.5">
                  <div className="flex items-start justify-between">
                    <span className={`font-display text-xl leading-none ${orden ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {mesa.numero}
                    </span>
                    <StatusBadge estado={estado} />
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                      <span>👥 {mesa.capacidad}</span>
                      {orden && <span>⏱ {formatTiempo(elapsed)}</span>}
                    </div>
                    {orden && (
                      <div className="font-mono text-lg font-bold text-accent -ml-0.5">
                        ${orden.total.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    {orden?.usuario_nombre ? (
                      <span className="text-text-secondary truncate">{orden.usuario_nombre}</span>
                    ) : (
                      <span />
                    )}
                    {orden && (
                      <span className="text-text-secondary group-hover:text-accent transition-colors font-medium">
                        Ver orden →
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
