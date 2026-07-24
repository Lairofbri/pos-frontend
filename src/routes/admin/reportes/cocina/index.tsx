import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'tiempo-preparacion',
    nombre: 'Tiempo de Preparación',
    descripcion: 'Tiempo promedio de preparación por producto y categoría',
    endpoint: '/reportes/pos/cocina/tiempo-preparacion',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 7*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Producto', key: 'productoNombre' },
      { header: 'Categoría', key: 'categoriaNombre' },
      { header: 'Tiempo Promedio (min)', key: 'tiempoPromedio', formato: 'numero' as const },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
    ],
    pdfFilename: 'tiempo-preparacion',
  },
]

export default function CocinaPage() {
  return (
    <ReporteGenerico
      titulo="Cocina"
      categoria="Reportes de tiempos de preparación en cocina"
      reportes={reportes}
    />
  )
}
