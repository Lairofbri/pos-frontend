import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'costo-por-producto',
    nombre: 'Costo por Producto',
    descripcion: 'Costo unitario, ventas, margen bruto y % por producto',
    endpoint: '/reportes/pos/costos/por-producto',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0, 10) },
    ],
    columnas: [
      { header: 'Producto', key: 'productoNombre' },
      { header: 'Vendidos', key: 'totalVendidos', formato: 'numero' as const },
      { header: 'Costo Unit.', key: 'costoPromedio', formato: 'moneda' as const },
      { header: 'Ventas', key: 'totalVentas', formato: 'moneda' as const },
      { header: 'Costo Total', key: 'costoTotal', formato: 'moneda' as const },
      { header: 'Margen %', key: 'margenPct' },
    ],
    pdfFilename: 'costo-por-producto',
    nota: 'Usa costo_promedio actual del producto aplicado a cantidades vendidas en el período.',
  },
  {
    id: 'costo-por-categoria',
    nombre: 'Food Cost por Categoría',
    descripcion: 'Food cost % por categoría de productos',
    endpoint: '/reportes/pos/costos/por-categoria',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0, 10) },
    ],
    columnas: [
      { header: 'Categoría', key: 'categoriaNombre' },
      { header: 'Productos', key: 'productos', formato: 'numero' as const },
      { header: 'Vendidos', key: 'totalVendidos', formato: 'numero' as const },
      { header: 'Ventas', key: 'totalVentas', formato: 'moneda' as const },
      { header: 'Costo Total', key: 'costoTotal', formato: 'moneda' as const },
    ],
    pdfFilename: 'costo-por-categoria',
    nota: 'Agrupa los costos por categoría de producto. Incluye food cost % en el PDF.',
  },
  {
    id: 'margen-evolucion',
    nombre: 'Evolución de Ingresos',
    descripcion: 'Ingresos diarios/semanales/mensuales con tendencia',
    endpoint: '/reportes/pos/costos/margen-evolucion',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0, 10) },
      { nombre: 'agrupar', label: 'Agrupar por', tipo: 'select' as const, opciones: [
        { value: 'dia', label: 'Día' },
        { value: 'semana', label: 'Semana' },
        { value: 'mes', label: 'Mes' },
      ], defecto: 'dia' },
    ],
    columnas: [
      { header: 'Fecha', key: 'fecha', formato: 'fecha' as const },
      { header: 'Órdenes', key: 'ordenes', formato: 'numero' as const },
      { header: 'Ingresos', key: 'ingresos', formato: 'moneda' as const },
    ],
    pdfFilename: 'margen-evolucion',
    nota: 'Evolución de ingresos de órdenes pagadas. Cruza con rentabilidad para análisis de márgenes.',
  },
  {
    id: 'inventario-valorizado',
    nombre: 'Inventario Valorizado',
    descripcion: 'Valor total del inventario actual a costo promedio',
    endpoint: '/reportes/pos/costos/inventario-valorizado',
    parametros: [
      { nombre: 'fecha', label: 'Fecha de corte', tipo: 'date' as const, defecto: new Date().toISOString().slice(0, 10) },
    ],
    columnas: [
      { header: 'Producto', key: 'productoNombre' },
      { header: 'Unidad', key: 'unidad' },
      { header: 'Stock', key: 'stockActual', formato: 'numero' as const },
      { header: 'Costo Unit.', key: 'costoPromedio', formato: 'moneda' as const },
      { header: 'Valor Total', key: 'valorTotal', formato: 'moneda' as const },
    ],
    pdfFilename: 'inventario-valorizado',
    nota: 'Valor del inventario calculado como stock_actual × costo_promedio. Solo productos con stock > 0.',
  },
]

export default function CostosPage() {
  return (
    <ReporteGenerico
      titulo="Costos"
      categoria="Reportes de costos, márgenes, evolución e inventario valorizado"
      reportes={reportes}
    />
  )
}
