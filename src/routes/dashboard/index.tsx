import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { getMesas, getResumenHoy, getRentabilidadTop, getEvolucion7d } from './api'
import type { EvolucionRow } from './api'
import { obtenerResumen } from '../admin/inventario/api'
import { useCajaActiva } from '../../hooks/useCajaActiva'
import { MetricsSection } from './components/MetricsSection'
import type { MetricasReales } from './components/MetricsSection'
import { OperationalStatus } from './components/OperationalStatus'
import { ProductPerformance } from './components/ProductPerformance'
import { TrendsSection } from './components/TrendsSection'
import { AlertsSection } from './components/AlertsSection'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { useAuthStore } from '../../store/authStore'

function computeTrend(hoy: number, ayer: number): number | null {
  if (ayer === 0) return null
  return ((hoy - ayer) / ayer) * 100
}

function getTodayYesterday(evolucion: EvolucionRow[]) {
  const sorted = [...evolucion].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const hoy = sorted[sorted.length - 1]
  const ayer = sorted[sorted.length - 2]
  return { hoy, ayer }
}

export default function DashboardPage() {
  const sucursalId = useAuthStore((s) => s.sucursalId)
  const { caja } = useCajaActiva()

  const { data: resumen, isLoading: rLoading } = useQuery({
    queryKey: ['dashboard-resumen', sucursalId],
    queryFn: getResumenHoy,
    ...queryDefaults('dashboard-resumen'),
  })

  const { data: rentabilidad } = useQuery({
    queryKey: ['dashboard-rentabilidad'],
    queryFn: getRentabilidadTop,
    ...queryDefaults('dashboard-rentabilidad'),
  })

  const { data: evolucion } = useQuery({
    queryKey: ['dashboard-evolucion', sucursalId],
    queryFn: getEvolucion7d,
    ...queryDefaults('dashboard-evolucion'),
  })

  const { data: mesas } = useQuery({
    queryKey: ['mesas', sucursalId],
    queryFn: getMesas,
    ...queryDefaults('mesas'),
  })

  const { data: inventario } = useQuery({
    queryKey: ['inventario-resumen'],
    queryFn: obtenerResumen,
    ...queryDefaults('inventario-resumen'),
  })

  const metrics = useMemo((): MetricasReales => {
    const ventasHoy = resumen ? parseFloat(resumen.total_ingresos) : 0
    const ordenesHoy = resumen?.cantidad_ordenes ?? 0
    const personasHoy = resumen?.total_personas ?? 0
    const promedioPersona = personasHoy > 0 ? ventasHoy / personasHoy : 0

    const evo = evolucion ?? []
    const { hoy: todayEvo, ayer: yesterdayEvo } = getTodayYesterday(evo)

    const foodCostPct = todayEvo && todayEvo.ingresos > 0
      ? (todayEvo.costo / todayEvo.ingresos) * 100
      : 0
    const margenBruto = todayEvo?.margen_bruto ?? 0

    return {
      ventas_hoy: ventasHoy,
      promedio_persona: promedioPersona,
      ordenes_hoy: ordenesHoy,
      personas_hoy: personasHoy,
      food_cost_pct: foodCostPct,
      margen_bruto: margenBruto,
      trend_ventas: computeTrend(
        todayEvo?.ingresos ?? 0,
        yesterdayEvo?.ingresos ?? 0,
      ),
      trend_ordenes: computeTrend(
        todayEvo?.ordenes ?? 0,
        yesterdayEvo?.ordenes ?? 0,
      ),
      trend_personas: null,
    }
  }, [resumen, evolucion])

  const productosPerdida = useMemo(
    () => (rentabilidad ?? []).filter(p => p.alerta === 'perdida'),
    [rentabilidad],
  )

  const loading = rLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="dashboard-bg-cream min-h-full p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen operativo del día"
      />

      <div className="flex flex-col gap-4">
        <MetricsSection metrics={metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OperationalStatus
            mesas={mesas ?? []}
            cajaEstado={caja?.estado ?? 'cerrada'}
            cajaVentas={caja?.total_ventas ?? 0}
          />
          <ProductPerformance productos={rentabilidad ?? []} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendsSection evolucion={evolucion ?? []} />
          <AlertsSection
            alertasStock={inventario?.alertas_count ?? 0}
            productosPerdida={productosPerdida}
            cajaAbierta={caja?.estado === 'abierta'}
            evolucion={evolucion ?? []}
          />
        </div>
      </div>
    </div>
  )
}
