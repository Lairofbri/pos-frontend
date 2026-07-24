import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'por-periodo',
    nombre: 'DTE por Período',
    descripcion: 'DTE emitidos agrupados por día, semana o mes',
    endpoint: '/reportes/dte/emisiones/por-periodo',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
      { nombre: 'agrupar', label: 'Agrupar por', tipo: 'select' as const, opciones: [
        { value: 'dia', label: 'Día' },
        { value: 'semana', label: 'Semana' },
        { value: 'mes', label: 'Mes' },
      ], defecto: 'dia' },
    ],
    columnas: [
      { header: 'Periodo', key: 'periodo', formato: 'fecha' as const },
      { header: 'DTEs Emitidos', key: 'totalDtes', formato: 'numero' as const },
      { header: 'Monto Total', key: 'totalMonto', formato: 'moneda' as const },
    ],
    pdfFilename: 'dte-por-periodo',
  },
  {
    id: 'por-tipo',
    nombre: 'DTE por Tipo',
    descripcion: 'DTE desglosados por tipo (FCF, CCF, FSE, NC, ND)',
    endpoint: '/reportes/dte/emisiones/por-tipo',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Tipo DTE', key: 'tipoDte' },
      { header: 'Cantidad', key: 'totalDtes', formato: 'numero' as const },
      { header: 'Monto', key: 'totalMonto', formato: 'moneda' as const },
      { header: 'IVA', key: 'totalIva', formato: 'moneda' as const },
    ],
    pdfFilename: 'dte-por-tipo',
  },
  {
    id: 'por-estado',
    nombre: 'DTE por Estado',
    descripcion: 'DTE agrupados por estado del ciclo de vida',
    endpoint: '/reportes/dte/emisiones/por-estado',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Estado', key: 'estado' },
      { header: 'DTEs', key: 'totalDtes', formato: 'numero' as const },
      { header: 'Monto Total', key: 'totalMonto', formato: 'moneda' as const },
    ],
    pdfFilename: 'dte-por-estado',
  },
  {
    id: 'rechazados',
    nombre: 'DTE Rechazados',
    descripcion: 'DTE rechazados por Hacienda con motivos',
    endpoint: '/reportes/dte/emisiones/rechazados',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Código Generación', key: 'codigoGeneracion' },
      { header: 'Tipo', key: 'tipoDte' },
      { header: 'Fecha', key: 'fechaEmision', formato: 'fecha' as const },
      { header: 'Motivo Rechazo', key: 'motivoRechazo' },
      { header: 'Monto', key: 'total', formato: 'moneda' as const },
    ],
    pdfFilename: 'dte-rechazados',
  },
  {
    id: 'montos-facturados',
    nombre: 'Montos Facturados + IVA',
    descripcion: 'Desglose de montos facturados por mes y tipo DTE',
    endpoint: '/reportes/dte/emisiones/montos-facturados',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 180*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Mes', key: 'mes', formato: 'fecha' as const },
      { header: 'Tipo DTE', key: 'tipoDte' },
      { header: 'Subtotal', key: 'subtotal', formato: 'moneda' as const },
      { header: 'IVA', key: 'iva', formato: 'moneda' as const },
      { header: 'Exento', key: 'exento', formato: 'moneda' as const },
      { header: 'Total', key: 'total', formato: 'moneda' as const },
    ],
    pdfFilename: 'montos-facturados',
  },
  {
    id: 'tasa-aceptacion',
    nombre: 'Tasa de Aceptación',
    descripcion: 'Porcentaje de DTE aceptados vs rechazados',
    endpoint: '/reportes/dte/emisiones/tasa-aceptacion',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 90*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Periodo', key: 'periodo', formato: 'fecha' as const },
      { header: 'Aceptados', key: 'aceptados', formato: 'numero' as const },
      { header: 'Rechazados', key: 'rechazados', formato: 'numero' as const },
      { header: 'Contingencia', key: 'contingencias', formato: 'numero' as const },
      { header: 'Tasa Aceptación', key: 'tasaAceptacion' },
    ],
    pdfFilename: 'tasa-aceptacion',
  },
  {
    id: 'por-establecimiento',
    nombre: 'DTE por Establecimiento',
    descripcion: 'DTE emitidos por cada establecimiento',
    endpoint: '/reportes/dte/establecimientos/por-establecimiento',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Establecimiento', key: 'establecimientoNombre' },
      { header: 'DTEs', key: 'totalDtes', formato: 'numero' as const },
      { header: 'Monto Total', key: 'totalMonto', formato: 'moneda' as const },
    ],
    pdfFilename: 'dte-por-establecimiento',
  },
  {
    id: 'anulados',
    nombre: 'DTE Anulados',
    descripcion: 'DTE que han sido anulados',
    endpoint: '/reportes/dte/anulaciones',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 90*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Código Generación', key: 'codigoGeneracion' },
      { header: 'Tipo', key: 'tipoDte' },
      { header: 'Fecha Anulación', key: 'fechaAnulacion', formato: 'fecha' as const },
      { header: 'Motivo', key: 'motivo' },
      { header: 'Monto', key: 'total', formato: 'moneda' as const },
    ],
    pdfFilename: 'dte-anulados',
  },
  {
    id: 'eventos-contingencia',
    nombre: 'Eventos de Contingencia',
    descripcion: 'Registro de eventos de contingencia',
    endpoint: '/reportes/dte/contingencia/eventos',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 90*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Fecha', key: 'fecha', formato: 'fecha' as const },
      { header: 'Tipo', key: 'tipo' },
      { header: 'Motivo', key: 'motivo' },
      { header: 'DTEs Afectados', key: 'dtesAfectados', formato: 'numero' as const },
      { header: 'Estado', key: 'estado' },
    ],
    pdfFilename: 'eventos-contingencia',
  },
  {
    id: 'pendientes-resolucion',
    nombre: 'DTE Pendientes de Resolución',
    descripcion: 'DTE en contingencia pendientes de resolución',
    endpoint: '/reportes/dte/contingencia/pendientes',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Código DTE', key: 'codigoGeneracion' },
      { header: 'Tipo', key: 'tipoDte' },
      { header: 'Evento', key: 'evento' },
      { header: 'Fecha', key: 'fecha', formato: 'fecha' as const },
      { header: 'Días Pendiente', key: 'diasPendiente', formato: 'numero' as const },
    ],
    pdfFilename: 'pendientes-resolucion',
  },
  {
    id: 'tasa-resolucion',
    nombre: 'Tasa de Resolución',
    descripcion: 'Efectividad en resolución de contingencias',
    endpoint: '/reportes/dte/contingencia/tasa-resolucion',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 90*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Periodo', key: 'periodo', formato: 'fecha' as const },
      { header: 'Resueltos', key: 'resueltos', formato: 'numero' as const },
      { header: 'Pendientes', key: 'pendientes', formato: 'numero' as const },
      { header: 'Tasa Resolución', key: 'tasaResolucion' },
    ],
    pdfFilename: 'tasa-resolucion',
  },
  {
    id: 'log-operaciones',
    nombre: 'Log de Operaciones',
    descripcion: 'Auditoría de operaciones realizadas en el sistema DTE',
    endpoint: '/reportes/dte/auditoria/operaciones',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 7*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
      { nombre: 'limite', label: 'Límite de registros', tipo: 'number' as const, defecto: '100' },
    ],
    columnas: [
      { header: 'Fecha', key: 'fecha', formato: 'fecha' as const },
      { header: 'Usuario', key: 'usuario' },
      { header: 'Acción', key: 'accion' },
      { header: 'Detalle', key: 'detalle' },
    ],
    pdfFilename: 'log-operaciones',
  },
]

export default function DteReportesPage() {
  return (
    <ReporteGenerico
      titulo="Reportes DTE"
      categoria="Facturación electrónica — emisiones, anulaciones, contingencias y auditoría"
      reportes={reportes}
    />
  )
}
