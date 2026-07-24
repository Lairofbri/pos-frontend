import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'comparativa',
    nombre: 'Comparativa de Sucursales',
    descripcion: 'Comparación de rendimiento entre sucursales',
    endpoint: '/reportes/pos/sucursales/comparativa',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Sucursal', key: 'sucursalNombre' },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
      { header: 'Ticket Promedio', key: 'ticketPromedio', formato: 'moneda' as const },
    ],
    pdfFilename: 'comparativa-sucursales',
  },
]

export default function SucursalesPage() {
  return (
    <ReporteGenerico
      titulo="Sucursales"
      categoria="Comparativa de rendimiento entre sucursales"
      reportes={reportes}
    />
  )
}
