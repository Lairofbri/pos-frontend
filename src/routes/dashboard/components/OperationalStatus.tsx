import { useMemo } from 'react'
import { DashboardCard } from '../../../components/shared/DashboardCard'
import type { Mesa } from '../../../types'

interface OperationalStatusProps {
  mesas: Mesa[]
  cajaEstado: string
  cajaVentas: number
}

const STATUSES = [
  { label: 'Libres', key: 'disponible', bg: '#EAF7EC', border: '#67BA78', text: '#3A9150' },
  { label: 'Ocupadas', key: 'ocupada', bg: '#FBE8E7', border: '#C5544B', text: '#A83C36' },
  { label: 'Reservadas', key: 'reservada', bg: '#E6F2FB', border: '#4E9AD4', text: '#2E73B2' },
  { label: 'Inactivas', key: 'inactiva', bg: '#F0EBE6', border: '#C7BEB5', text: '#8C8177' },
] as const

export function OperationalStatus({ mesas, cajaEstado, cajaVentas }: OperationalStatusProps) {
  const counts = useMemo((): Record<string, number> => {
    const map = new Map<string, number>()
    for (const m of mesas) {
      map.set(m.estado, (map.get(m.estado) ?? 0) + 1)
    }
    const result: Record<string, number> = {}
    for (const s of STATUSES) {
      result[s.key] = map.get(s.key) ?? 0
    }
    return result
  }, [mesas])

  const totalMesas = mesas.length
  const ocupacionPct = totalMesas > 0
    ? Math.round((counts.ocupada / totalMesas) * 100)
    : 0

  return (
    <DashboardCard title="Estado operativo">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map(s => (
            <div
              key={s.key}
              className="rounded-xl px-3 py-2.5 flex items-center justify-between"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <span className="text-xs font-semibold" style={{ color: s.text }}>{s.label}</span>
              <span className="font-mono text-sm font-bold" style={{ color: s.text }}>{counts[s.key]}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <div className="h-1.5 flex-1 rounded-full bg-wood-light overflow-hidden">
            <div
              className="h-full rounded-full bg-pos-accent transition-all"
              style={{ width: `${ocupacionPct}%` }}
            />
          </div>
          <span className="text-xs text-text-secondary font-mono">{ocupacionPct}% ocup</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-text-secondary">Caja</span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-full ${
              cajaEstado === 'abierta'
                ? 'bg-dashboard-success-bg text-dashboard-success-text'
                : 'bg-dashboard-danger-bg text-dashboard-danger-text'
            }`}>
              {cajaEstado === 'abierta' ? 'Abierta' : 'Cerrada'}
            </span>
            <span className="text-xs font-mono text-text-primary font-semibold">
              ${cajaVentas.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
