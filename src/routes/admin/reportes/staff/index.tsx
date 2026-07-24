import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'desempeno-mesero',
    nombre: 'Desempeño por Mesero',
    descripcion: 'Desempeño de ventas por cada mesero',
    endpoint: '/reportes/pos/staff/desempeno-mesero',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Mesero', key: 'meseroNombre' },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ventas', key: 'totalVentas', formato: 'moneda' as const },
      { header: 'Ticket Promedio', key: 'ticketPromedio', formato: 'moneda' as const },
    ],
    pdfFilename: 'desempeno-mesero',
  },
]

export default function StaffPage() {
  return (
    <ReporteGenerico
      titulo="Staff"
      categoria="Reportes de desempeño del personal"
      reportes={reportes}
    />
  )
}
