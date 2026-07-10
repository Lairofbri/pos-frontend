import { DashboardCard } from '../../../components/shared/DashboardCard'
import { TrendChart } from '../../../components/shared/TrendChart'
import type { VentaHora } from '../api'

interface TrendsSectionProps {
  ventasPorHora: VentaHora[]
}

export function TrendsSection({ ventasPorHora }: TrendsSectionProps) {
  const chartData = ventasPorHora.map(h => ({ label: h.hora, value: h.total }))
  const total = ventasPorHora.reduce((sum, h) => sum + h.total, 0)
  const horaPico = [...ventasPorHora].sort((a, b) => b.total - a.total)[0]

  return (
    <DashboardCard title="Tendencias de ventas">
      <TrendChart data={chartData} height={180} />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="text-xs text-text-secondary">
          Hora pico: <span className="font-semibold text-text-primary">{horaPico?.hora}</span>
        </div>
        <div className="text-xs text-text-secondary">
          Total 8h: <span className="font-semibold font-mono text-text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
    </DashboardCard>
  )
}
