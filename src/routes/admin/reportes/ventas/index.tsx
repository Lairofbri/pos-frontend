import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'por-periodo',
    nombre: 'Ventas por Período',
    descripcion: 'Ventas agrupadas por día, semana o mes',
    endpoint: '/reportes/pos/ventas/por-periodo',
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
      { header: 'Período', key: 'periodo', formato: 'fecha' as const },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
    ],
    pdfFilename: 'ventas-por-periodo',
    nota: 'Incluye solo órdenes pagadas. Puedes agrupar por día, semana o mes.',
  },
  {
    id: 'por-metodo-pago',
    nombre: 'Ventas por Método de Pago',
    descripcion: 'Desglose de ventas según método de pago',
    endpoint: '/reportes/pos/ventas/por-metodo-pago',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Método de Pago', key: 'metodo' },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
    ],
    pdfFilename: 'ventas-por-metodo-pago',
  },
  {
    id: 'por-sucursal',
    nombre: 'Ventas por Sucursal',
    descripcion: 'Comparativa de ventas entre sucursales',
    endpoint: '/reportes/pos/ventas/por-sucursal',
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
    pdfFilename: 'ventas-por-sucursal',
  },
  {
    id: 'por-tipo-orden',
    nombre: 'Ventas por Tipo de Orden',
    descripcion: 'Ventas desglosadas por tipo (rápido, mesa, delivery)',
    endpoint: '/reportes/pos/ventas/por-tipo-orden',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Tipo', key: 'tipo' },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
      { header: 'Ticket Promedio', key: 'ticketPromedio', formato: 'moneda' as const },
    ],
    pdfFilename: 'ventas-por-tipo-orden',
  },
  {
    id: 'por-origen',
    nombre: 'Ventas por Origen',
    descripcion: 'Ventas según canal de entrada (POS, Hugo, PedidosYa, etc.)',
    endpoint: '/reportes/pos/ventas/por-origen',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Origen', key: 'origen' },
      { header: 'Órdenes', key: 'totalOrdenes', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
    ],
    pdfFilename: 'ventas-por-origen',
  },
]

export default function VentasPage() {
  return (
    <ReporteGenerico
      titulo="Ventas"
      categoria="Reportes de ventas por período, método de pago, sucursal y más"
      reportes={reportes}
    />
  )
}
