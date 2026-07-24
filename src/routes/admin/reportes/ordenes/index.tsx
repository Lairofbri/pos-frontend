import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'ticket-promedio',
    nombre: 'Ticket Promedio',
    descripcion: 'Ticket promedio por período, incluye mediana',
    endpoint: '/reportes/pos/ordenes/ticket-promedio',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Período', key: 'periodo', formato: 'fecha' as const },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ticket Promedio', key: 'ticketPromedio', formato: 'moneda' as const },
      { header: 'Mediana', key: 'mediana', formato: 'moneda' as const },
    ],
    pdfFilename: 'ticket-promedio',
  },
  {
    id: 'horas-pico',
    nombre: 'Horas Pico',
    descripcion: 'Distribución de ventas por hora del día',
    endpoint: '/reportes/pos/ordenes/horas-pico',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Hora', key: 'hora' },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
    ],
    pdfFilename: 'horas-pico',
  },
  {
    id: 'canceladas',
    nombre: 'Órdenes Canceladas',
    descripcion: 'Órdenes canceladas vs completadas en el período',
    endpoint: '/reportes/pos/ordenes/canceladas',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Período', key: 'periodo', formato: 'fecha' as const },
      { header: 'Canceladas', key: 'canceladas', formato: 'numero' as const },
      { header: 'Completadas', key: 'completadas', formato: 'numero' as const },
      { header: '% Cancelación', key: 'porcentajeCancelacion' },
    ],
    pdfFilename: 'ordenes-canceladas',
  },
]

export default function OrdenesPage() {
  return (
    <ReporteGenerico
      titulo="Órdenes"
      categoria="Reportes de ticket promedio, horas pico y órdenes canceladas"
      reportes={reportes}
    />
  )
}
