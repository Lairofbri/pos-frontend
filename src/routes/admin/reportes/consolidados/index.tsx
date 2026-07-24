import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'conciliacion-pos-dte',
    nombre: 'Conciliación POS ↔ DTE',
    descripcion: 'Órdenes pagadas vs DTE emitidos — detecta órdenes sin DTE',
    endpoint: '/reportes/consolidados/conciliacion-pos-dte',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Indicador', key: 'indicador' },
      { header: 'Valor', key: 'valor' },
    ],
    pdfFilename: 'conciliacion-pos-dte',
    nota: 'Muestra el resumen de conciliación. Los detalles de órdenes sin DTE se incluyen en el PDF.',
  },
  {
    id: 'ingresos-vs-dte',
    nombre: 'Ingresos POS vs DTE Emitidos',
    descripcion: 'Comparativa mensual de ingresos POS contra montos facturados en DTE',
    endpoint: '/reportes/consolidados/ingresos-vs-dte',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 180*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Periodo', key: 'periodo', formato: 'fecha' as const },
      { header: 'Ingresos POS', key: 'ingresosPos', formato: 'moneda' as const },
      { header: 'Ingresos DTE', key: 'ingresosDte', formato: 'moneda' as const },
      { header: 'Brecha', key: 'brecha', formato: 'moneda' as const },
    ],
    pdfFilename: 'ingresos-vs-dte',
  },
]

export default function ConsolidadosReportesPage() {
  return (
    <ReporteGenerico
      titulo="Reportes Consolidados"
      categoria="Conciliación y comparativas entre sistemas POS y DTE"
      reportes={reportes}
    />
  )
}
