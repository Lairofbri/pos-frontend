import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Wallet, HelpCircle, Calendar } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { queryDefaults } from '../../../config/queries'
import { listarRentabilidad, listarEvolucionRentabilidad } from '../productos/api'
import type { RentabilidadProducto, EvolucionRow } from '../productos/api'
import { PageHeader } from '../../../components/shared/PageHeader'
import { Spinner } from '../../../components/ui/Spinner'

const alertaColor: Record<string, string> = {
  ganancia: '#059669',
  equilibrio: '#D97706',
  perdida: '#DC2626',
  sin_datos: '#94A3B8',
}

const alertaBg: Record<string, string> = {
  ganancia: 'bg-emerald-500/10 text-emerald-600',
  equilibrio: 'bg-amber-500/10 text-amber-600',
  perdida: 'bg-red-500/10 text-red-600',
  sin_datos: 'bg-slate-400/10 text-slate-500',
}

export default function RentabilidadDashboard() {
  const { data: rentabilidad, isLoading } = useQuery({
    queryKey: ['rentabilidad', 'margen_desc', ''],
    queryFn: () => listarRentabilidad(),
    ...queryDefaults('rentabilidad'),
  })

  const { data: evolucion, isLoading: evoLoading } = useQuery({
    queryKey: ['rentabilidad-evolucion'],
    queryFn: () => listarEvolucionRentabilidad(),
    ...queryDefaults('rentabilidad-evolucion'),
  })

  const chartData = (evolucion ?? []).map((row: EvolucionRow) => ({
    label: new Date(row.fecha).toLocaleDateString('es-SV', { day: '2-digit', month: 'short' }),
    margen: row.margen_bruto,
    ingresos: row.ingresos,
    costo: row.costo,
    margenPct: row.margen_pct,
  }))

  const topProductos = (rentabilidad?.productos ?? [])
    .filter((p: RentabilidadProducto) => p.costo_promedio > 0)
    .slice(0, 8)

  const barData = topProductos.map((p: RentabilidadProducto) => ({
    name: p.nombre.length > 20 ? p.nombre.slice(0, 20) + '...' : p.nombre,
    margen: p.margen_bruto,
    margenPct: p.margen_pct,
  }))

  const alertaCounts: Record<string, number> = { ganancia: 0, equilibrio: 0, perdida: 0, sin_datos: 0 }
  for (const p of (rentabilidad?.productos ?? [])) {
    alertaCounts[p.alerta] = (alertaCounts[p.alerta] || 0) + 1
  }

  const alertaChart = Object.entries(alertaCounts).map(([key, value]) => ({
    name: key === 'ganancia' ? 'Ganancia' : key === 'equilibrio' ? 'Equilibrio' : key === 'perdida' ? 'Pérdida' : 'Sin datos',
    value,
    color: alertaColor[key],
  }))

  const avgMargin = evolucion && evolucion.length > 0
    ? evolucion.reduce((s: number, r: EvolucionRow) => s + r.margen_pct, 0) / evolucion.length
    : 0

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Rentabilidad" subtitle="Dashboard de costos, márgenes y tendencias" />

      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="size-10 rounded-lg flex items-center justify-center bg-accent/10 text-accent shrink-0">
                  <TrendingUp className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xl font-bold tabular-nums text-text-primary">
                    ${(rentabilidad?.resumen.margen_bruto_total ?? 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-text-secondary truncate">Margen bruto total</span>
                </div>
              </div>

              <div className="bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  (rentabilidad?.resumen.food_cost_pct ?? 0) > 60 ? 'bg-danger/10 text-danger' :
                  (rentabilidad?.resumen.food_cost_pct ?? 0) > 40 ? 'bg-warning/10 text-warning' :
                  'bg-success/10 text-success'
                }`}>
                  <Wallet className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xl font-bold tabular-nums text-text-primary">{rentabilidad?.resumen.food_cost_pct ?? 0}%</span>
                  <span className="text-[11px] text-text-secondary truncate">Food cost promedio</span>
                </div>
              </div>

              <div className="bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  (rentabilidad?.resumen.sin_costo_count ?? 0) > 0 ? 'bg-warning/10 text-warning' : 'bg-slate-400/10 text-slate-500'
                }`}>
                  <HelpCircle className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xl font-bold tabular-nums text-text-primary">{rentabilidad?.resumen.sin_costo_count ?? 0}</span>
                  <span className="text-[11px] text-text-secondary truncate">Sin costo</span>
                </div>
              </div>

              <div className="bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  avgMargin >= 20 ? 'bg-success/10 text-success' :
                  avgMargin > 0 ? 'bg-warning/10 text-warning' :
                  'bg-danger/10 text-danger'
                }`}>
                  <Calendar className="size-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xl font-bold tabular-nums text-text-primary">{avgMargin.toFixed(1)}%</span>
                  <span className="text-[11px] text-text-secondary truncate">Margen promedio período</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
              {/* Evolution Chart — takes 3 cols */}
              <div className="lg:col-span-3 bg-bg-surface border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Evolución del margen</h3>
                <p className="text-xs text-text-secondary mb-4">Últimos 30 días</p>
                {evoLoading ? (
                  <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : chartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-secondary">
                    <TrendingUp className="size-8" />
                    <span className="text-sm">Sin datos de evolución</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="margenGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C7662E" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#C7662E" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#E8D6C0" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8C8177' }} axisLine={{ stroke: '#E8D6C0' }} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: '#8C8177' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ background: '#FAF6F1', border: '1px solid #E8D6C0', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 12px rgba(70,55,40,0.1)' }}
                        formatter={(value: unknown, name: unknown) => {
                          const v = Number(value)
                          const n = String(name)
                          const label = n === 'ingresos' ? 'Ingresos' : n === 'margen' ? 'Margen' : 'Costo'
                          return [v != null ? `$${v.toFixed(2)}` : `$0.00`, label]
                        }}
                      />
                      <Area type="monotone" dataKey="ingresos" stroke="#059669" strokeWidth={2} fill="none" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="margen" stroke="#C7662E" strokeWidth={2} fill="url(#margenGrad)" />
                      <Area type="monotone" dataKey="costo" stroke="#DC2626" strokeWidth={1.5} fill="none" strokeDasharray="2 2" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Alert Distribution — takes 2 cols */}
              <div className="lg:col-span-2 bg-bg-surface border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Distribución de productos</h3>
                <p className="text-xs text-text-secondary mb-4">Por estado de rentabilidad</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={alertaChart} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid stroke="#E8D6C0" strokeDasharray="3 3" strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#8C8177' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#8C8177' }} axisLine={false} tickLine={false} width={75} />
                    <Tooltip
                      contentStyle={{ background: '#FAF6F1', border: '1px solid #E8D6C0', borderRadius: 12, fontSize: 12 }}
                      formatter={(value: unknown) => [Number(value), 'Productos']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {alertaChart.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products Bar Chart */}
            {barData.length > 0 && (
              <div className="bg-bg-surface border border-border rounded-xl p-5 mb-4">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Top productos por margen</h3>
                <p className="text-xs text-text-secondary mb-4">Productos con mayor margen bruto</p>
                <div className="space-y-3">
                  {barData.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-[140px] truncate shrink-0">{item.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-accent/80"
                          style={{ width: `${Math.min(Math.max(item.margenPct, 0) / 2, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-text-primary w-[80px] text-right shrink-0">
                        ${item.margen.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-xs font-medium w-[48px] text-right shrink-0 ${
                        item.margenPct >= 20 ? 'text-success' : item.margenPct >= 0 ? 'text-warning' : 'text-danger'
                      }`}>
                        {item.margenPct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed table */}
            <div className="bg-bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Detalle de productos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-text-secondary text-left border-b border-border">
                      <th className="pb-2 pr-2 font-medium">Producto</th>
                      <th className="pb-2 pr-2 font-medium text-right">Precio</th>
                      <th className="pb-2 pr-2 font-medium text-right hidden sm:table-cell">Costo</th>
                      <th className="pb-2 pr-2 font-medium text-right">Margen $</th>
                      <th className="pb-2 pr-2 font-medium text-right">Margen %</th>
                      <th className="pb-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rentabilidad?.productos ?? []).slice(0, 20).map((p: RentabilidadProducto) => (
                      <tr key={p.id} className="border-b border-border/30 hover:bg-bg-surface/50">
                        <td className="py-2 pr-2">
                          <span className="font-medium text-text-primary">{p.nombre}</span>
                          {p.tiene_receta && (
                            <span className="ml-1 text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">Receta</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-right font-mono text-text-primary">${p.precio_venta.toFixed(2)}</td>
                        <td className="py-2 pr-2 text-right font-mono text-text-secondary hidden sm:table-cell">
                          {p.costo_promedio > 0 ? `$${p.costo_promedio.toFixed(2)}` : '—'}
                        </td>
                        <td className={`py-2 pr-2 text-right font-mono font-semibold ${p.margen_bruto > 0 ? 'text-success' : p.margen_bruto < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                          ${p.margen_bruto.toFixed(2)}
                        </td>
                        <td className="py-2 pr-2 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${p.margen_pct >= 40 ? 'bg-emerald-500' : p.margen_pct >= 20 ? 'bg-amber-500' : p.margen_pct >= 0 ? 'bg-red-400' : 'bg-slate-300'}`}
                                style={{ width: `${Math.min(Math.abs(p.margen_pct), 100)}%` }}
                              />
                            </div>
                            <span className={`font-mono font-semibold text-xs ${p.margen_pct >= 20 ? 'text-success' : p.margen_pct >= 0 ? 'text-warning' : p.margen_pct < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                              {p.margen_pct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${alertaBg[p.alerta]}`}>
                            {p.alerta === 'ganancia' ? 'Ganancia' : p.alerta === 'equilibrio' ? 'Equilibrio' : p.alerta === 'perdida' ? 'Pérdida' : 'Sin datos'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
