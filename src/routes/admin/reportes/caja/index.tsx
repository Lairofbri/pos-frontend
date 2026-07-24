import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'resumen-diario',
    nombre: 'Resumen Diario de Caja',
    descripcion: 'Resumen de ingresos por fecha',
    endpoint: '/reportes/pos/caja/resumen-diario',
    parametros: [
      { nombre: 'fecha', label: 'Fecha', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Método', key: 'metodo' },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
    ],
    pdfFilename: 'resumen-diario',
  },
  {
    id: 'cuadre',
    nombre: 'Cuadre de Caja',
    descripcion: 'Cuadre detallado esperado vs real',
    endpoint: '/reportes/pos/caja/cuadre-caja',
    parametros: [
      { nombre: 'cajaId', label: 'ID de Caja', tipo: 'number' as const, defecto: '' },
    ],
    columnas: [
      { header: 'Concepto', key: 'concepto' },
      { header: 'Esperado', key: 'esperado', formato: 'moneda' as const },
      { header: 'Real', key: 'real', formato: 'moneda' as const },
      { header: 'Diferencia', key: 'diferencia', formato: 'moneda' as const },
    ],
    pdfFilename: 'cuadre-caja',
    nota: 'Requiere el ID de la caja a cuadrar. Consulta el historial de caja para obtenerlo.',
  },
]

export default function CajaPage() {
  return (
    <ReporteGenerico
      titulo="Caja"
      categoria="Reportes de resumen diario y cuadre de caja"
      reportes={reportes}
    />
  )
}
