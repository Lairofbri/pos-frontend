import { useState, useEffect, useMemo } from 'react'
import type { CocinaItem } from '../api'

interface CocinaCardProps {
  item: CocinaItem
  onMarcarListo: (ordenId: string, itemId: string) => void
  onCompletada: (ordenId: string) => void
  onImprimir: (ordenId: string) => void
}

function TimerDisplay({ baseMinutes }: { baseMinutes: number }) {
  const [elapsed, setElapsed] = useState(baseMinutes)

  useEffect(() => {
    setElapsed(baseMinutes)
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 60000)
    return () => clearInterval(interval)
  }, [baseMinutes])

  const isOverdue = elapsed > 20
  const isCritical = elapsed > 30

  return (
    <span className={`cocina-timer ${isCritical ? 'cocina-timer-warning cocina-pulse' : isOverdue ? 'cocina-timer-warning' : 'text-text-secondary'}`}>
      {elapsed < 60 ? `${elapsed}min` : `${Math.floor(elapsed / 60)}h${elapsed % 60}m`}
    </span>
  )
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#4E9AD4',
  en_proceso: '#D97A43',
  listo: '#67BA78',
  cancelado: '#8C8177',
}

export function CocinaCard({ item, onMarcarListo, onCompletada, onImprimir }: CocinaCardProps) {
  const itemsPendientes = useMemo(() => item.items.filter(i => i.estado === 'pendiente'), [item])
  const itemsEnProceso = useMemo(() => item.items.filter(i => i.estado === 'en_proceso' || i.estado === 'listo'), [item])

  return (
    <div className="cocina-card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-semibold text-sm text-text-primary">
            {item.mesa_numero ? `Mesa ${item.mesa_numero}` : 'Venta rápida'}
          </span>
          {item.zona && <span className="text-xs text-text-secondary ml-2">{item.zona}</span>}
        </div>
        <TimerDisplay baseMinutes={item.tiempo_transcurrido} />
      </div>

      <div className="space-y-1 mb-3">
        {item.items.map((i) => (
          <div key={i.id} className="flex items-center gap-2 text-xs" style={{ borderLeft: `3px solid ${ESTADO_COLORS[i.estado] || '#8C8177'}`, paddingLeft: 8 }}>
            <span className="font-semibold text-text-primary">{i.cantidad}x</span>
            <span className="text-text-secondary flex-1 truncate">{i.nombre}</span>
            <button
              onClick={() => onMarcarListo(item.orden_id, i.id)}
              disabled={i.estado === 'listo' || i.estado === 'cancelado'}
              className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                i.estado === 'listo'
                  ? 'bg-dashboard-success-bg text-dashboard-success-text border-dashboard-success-bg'
                  : i.estado === 'cancelado'
                  ? 'border-text-secondary text-text-secondary'
                  : 'border-pos-accent text-pos-accent hover:bg-pos-accent hover:text-white'
              }`}
            >
              {i.estado === 'listo' ? '✅' : i.estado === 'cancelado' ? '✕' : 'Listo'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex gap-1.5">
          {itemsPendientes.length > 0 && (
            <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded" style={{ background: '#E6F2FB', color: '#2E73B2' }}>
              {itemsPendientes.length} pend.
            </span>
          )}
          {itemsEnProceso.length > 0 && (
            <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded" style={{ background: '#FFF1E0', color: '#D97A43' }}>
              {itemsEnProceso.length} prep.
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => onImprimir(item.orden_id)}
            className="text-[0.65rem] font-medium px-2 py-1 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-pos-accent transition-all cursor-pointer"
            title="Imprimir ticket"
          >
            🖨️
          </button>
          <button
            onClick={() => onCompletada(item.orden_id)}
            disabled={itemsPendientes.length > 0}
            className="text-[0.65rem] font-semibold px-2.5 py-1 rounded-lg bg-pos-accent text-white hover:bg-pos-accent-hover transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Completada
          </button>
        </div>
      </div>
    </div>
  )
}
