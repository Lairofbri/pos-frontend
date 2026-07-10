import { DashboardCard } from '../../../components/shared/DashboardCard'
import type { ProductoTop } from '../api'

interface ProductPerformanceProps {
  productos: ProductoTop[]
}

export function ProductPerformance({ productos }: ProductPerformanceProps) {
  const maxCantidad = Math.max(...productos.map(p => p.cantidad), 1)

  return (
    <DashboardCard title="Rendimiento de productos">
      <div className="space-y-3">
        {productos.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-wood-light flex items-center justify-center text-base shrink-0">
              {p.icono}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary truncate">{p.nombre}</span>
                <span className="text-xs font-mono text-text-secondary shrink-0 ml-2">{p.cantidad}</span>
              </div>
              <div className="h-1.5 rounded-full bg-wood-light overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pos-accent to-pos-accent-light transition-all"
                  style={{ width: `${(p.cantidad / maxCantidad) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}
