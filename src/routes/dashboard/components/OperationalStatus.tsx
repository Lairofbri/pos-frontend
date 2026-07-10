import { useMemo } from 'react'
import { DashboardCard } from '../../../components/shared/DashboardCard'
import type { Mesa } from '../../../types'

interface OperationalStatusProps {
  mesas: Mesa[]
  cajaEstado: string
  cajaVentas: number
}

export function OperationalStatus({ mesas, cajaEstado, cajaVentas }: OperationalStatusProps) {
  const counts = useMemo(() => ({
    libres: mesas.filter(m => m.estado === 'disponible').length,
    ocupadas: mesas.filter(m => m.estado === 'ocupada').length,
    reservadas: mesas.filter(m => m.estado === 'reservada').length,
    inactivas: mesas.filter(m => m.estado === 'inactiva').length,
  }), [mesas])

  const statuses = [
    { label: 'Libres', count: counts.libres, bg: '#EAF7EC', border: '#67BA78', text: '#3A9150' },
    { label: 'Ocupadas', count: counts.ocupadas, bg: '#FBE8E7', border: '#C5544B', text: '#A83C36' },
    { label: 'Reservadas', count: counts.reservadas, bg: '#E6F2FB', border: '#4E9AD4', text: '#2E73B2' },
    { label: 'Inactivas', count: counts.inactivas, bg: '#F0EBE6', border: '#C7BEB5', text: '#8C8177' },
  ]

  return (
    <DashboardCard title="Estado operativo">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {statuses.map(s => (
            <div
              key={s.label}
              className="rounded-xl px-3 py-2.5 flex items-center justify-between"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <span className="text-xs font-semibold" style={{ color: s.text }}>{s.label}</span>
              <span className="font-mono text-sm font-bold" style={{ color: s.text }}>{s.count}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs font-semibold text-text-secondary">Caja</span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-full ${
              cajaEstado === 'abierta' ? 'bg-dashboard-success-bg text-dashboard-success-text' : 'bg-dashboard-danger-bg text-dashboard-danger-text'
            }`}>
              {cajaEstado === 'abierta' ? 'Abierta' : 'Cerrada'}
            </span>
            <span className="text-xs font-mono text-text-primary font-semibold">${cajaVentas.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
