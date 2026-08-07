import { useNavigate } from 'react-router-dom'
import { BarChart, Package, Receipt, DollarSign, ChefHat, Store, Users, FileSpreadsheet, GitCompare, Coins } from 'lucide-react'
import { PageHeader } from '../../../components/shared/PageHeader'
import { DashboardCard } from '../../../components/shared/DashboardCard'
import type { ReactNode } from 'react'

const iconMap: Record<string, ReactNode> = {
  ventas: <BarChart className="size-7 text-pos-accent" />,
  productos: <Package className="size-7 text-pos-accent" />,
  ordenes: <Receipt className="size-7 text-pos-accent" />,
  caja: <DollarSign className="size-7 text-pos-accent" />,
  cocina: <ChefHat className="size-7 text-pos-accent" />,
  propinas: <DollarSign className="size-7 text-pos-accent" />,
  sucursales: <Store className="size-7 text-pos-accent" />,
  staff: <Users className="size-7 text-pos-accent" />,
  dte: <FileSpreadsheet className="size-7 text-pos-accent" />,
  consolidados: <GitCompare className="size-7 text-pos-accent" />,
  costos: <Coins className="size-7 text-pos-accent" />,
}

const categorias = [
  { ruta: 'ventas',       nombre: 'Ventas',       desc: 'Por período, método pago, sucursal, tipo y origen', cantidad: 5, prioridad: 'P0' },
  { ruta: 'productos',    nombre: 'Productos',    desc: 'Top vendidos, ingresos por categoría, stock bajo',   cantidad: 3, prioridad: 'P0' },
  { ruta: 'ordenes',      nombre: 'Órdenes',      desc: 'Ticket promedio, horas pico, canceladas',           cantidad: 3, prioridad: 'P0' },
  { ruta: 'caja',         nombre: 'Caja',         desc: 'Resumen diario, cuadre de caja',                    cantidad: 2, prioridad: 'P0' },
  { ruta: 'cocina',       nombre: 'Cocina',       desc: 'Tiempo de preparación',                              cantidad: 1, prioridad: 'P2' },
  { ruta: 'propinas',     nombre: 'Propinas',     desc: 'Propinas por mesero',                                cantidad: 1, prioridad: 'P2' },
  { ruta: 'sucursales',   nombre: 'Sucursales',   desc: 'Comparativa entre sucursales',                       cantidad: 1, prioridad: 'P1' },
  { ruta: 'staff',        nombre: 'Staff',        desc: 'Desempeño por mesero',                               cantidad: 1, prioridad: 'P2' },
  { ruta: 'dte',          nombre: 'DTE',           desc: 'Emisiones, establecimientos, anulaciones, contingencias', cantidad: 12, prioridad: 'P0' },
  { ruta: 'consolidados', nombre: 'Consolidados', desc: 'Conciliación POS vs DTE, ingresos vs facturado',      cantidad: 2, prioridad: 'P1' },
  { ruta: 'costos', nombre: 'Costos', desc: 'Costo por producto, food cost, evolución, inventario', cantidad: 4, prioridad: 'P0' },
]

export default function ReportesPage() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Genera reportes en PDF del sistema POS" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categorias.map(cat => (
          <DashboardCard key={cat.ruta} hover>
            <button
              onClick={() => navigate(cat.ruta)}
              className="w-full text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center size-10 rounded-xl bg-pos-accent/10">{iconMap[cat.ruta]}</span>
                <div>
                  <h3 className="font-display font-bold text-text-primary tracking-tight text-sm">
                    {cat.nombre}
                  </h3>
                  <span className={`text-[10px] font-semibold uppercase ${
                    cat.prioridad === 'P0' ? 'text-danger' : cat.prioridad === 'P1' ? 'text-pos-accent' : 'text-text-secondary'
                  }`}>
                    {cat.prioridad} · {cat.cantidad} reportes
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-secondary font-body leading-relaxed">
                {cat.desc}
              </p>
            </button>
          </DashboardCard>
        ))}
      </div>
    </div>
  )
}
