import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'por-mesero',
    nombre: 'Propinas por Mesero',
    descripcion: 'Propinas recibidas agrupadas por mesero',
    endpoint: '/reportes/pos/propinas/por-mesero',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Mesero', key: 'meseroNombre' },
      { header: 'Total Propinas', key: 'totalPropinas', formato: 'moneda' as const },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
    ],
    pdfFilename: 'propinas-por-mesero',
  },
]

export default function PropinasPage() {
  return (
    <ReporteGenerico
      titulo="Propinas"
      categoria="Reporte de propinas por mesero"
      reportes={reportes}
    />
  )
}
