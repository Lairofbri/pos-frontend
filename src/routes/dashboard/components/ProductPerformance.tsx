import { DashboardCard } from '../../../components/shared/DashboardCard'
import type { RentabilidadProducto } from '../api'

interface ProductPerformanceProps {
  productos: RentabilidadProducto[]
}

const ALERTA_COLOR: Record<string, string> = {
  ganancia: 'bg-green-500',
  equilibrio: 'bg-amber-500',
  perdida: 'bg-red-500',
  sin_datos: 'bg-gray-300',
}

export function ProductPerformance({ productos }: ProductPerformanceProps) {
  if (productos.length === 0) {
    return (
      <DashboardCard title="Top productos">
        <div className="flex flex-col items-center py-6 text-text-secondary">
          <span className="text-xs">Sin datos de rentabilidad</span>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Top productos">
      <div className="flex flex-col gap-3">
        {productos.map((p) => (
          <div key={p.id} className="flex items-center gap-2.5">
            <div className={`size-2 rounded-full shrink-0 ${ALERTA_COLOR[p.alerta] ?? 'bg-gray-300'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary truncate">{p.nombre}</span>
                <span className="text-xs font-mono text-text-secondary shrink-0 ml-2">
                  ${p.margen_bruto.toFixed(0)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-wood-light overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pos-accent to-pos-accent-light transition-all"
                  style={{ width: `${Math.min(Math.abs(p.margen_pct), 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-text-secondary mt-0.5 block">
                Margen {p.margen_pct >= 0 ? '+' : ''}{p.margen_pct.toFixed(1)}%
                {p.alerta === 'sin_datos' && ' — sin costo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}
