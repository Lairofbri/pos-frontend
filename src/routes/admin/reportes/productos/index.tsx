import { ReporteGenerico } from '../ReporteGenerico'

const reportes = [
  {
    id: 'top-productos',
    nombre: 'Top Productos más Vendidos',
    descripcion: 'Productos con mayor cantidad de ventas',
    endpoint: '/reportes/pos/productos/top',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
      { nombre: 'limite', label: 'Cantidad', tipo: 'number' as const, defecto: '20' },
    ],
    columnas: [
      { header: 'Producto', key: 'productoNombre' },
      { header: 'Categoría', key: 'categoriaNombre' },
      { header: 'Vendidos', key: 'totalVendidos', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
    ],
    pdfFilename: 'top-productos',
  },
  {
    id: 'ingresos-por-categoria',
    nombre: 'Ingresos por Categoría',
    descripcion: 'Ingresos agrupados por categoría de producto',
    endpoint: '/reportes/pos/productos/ingresos-por-categoria',
    parametros: [
      { nombre: 'desde', label: 'Desde', tipo: 'date' as const, defecto: new Date(Date.now() - 30*86400000).toISOString().slice(0,10) },
      { nombre: 'hasta', label: 'Hasta', tipo: 'date' as const, defecto: new Date().toISOString().slice(0,10) },
    ],
    columnas: [
      { header: 'Categoría', key: 'categoriaNombre' },
      { header: 'Productos', key: 'totalProductos', formato: 'numero' as const },
      { header: 'Vendidos', key: 'totalVendidos', formato: 'numero' as const },
      { header: 'Ingresos', key: 'totalIngresos', formato: 'moneda' as const },
    ],
    pdfFilename: 'ingresos-por-categoria',
  },
  {
    id: 'stock-bajo',
    nombre: 'Productos con Stock Bajo',
    descripcion: 'Productos cuyo inventario está por debajo del umbral',
    endpoint: '/reportes/pos/productos/stock-bajo',
    parametros: [
      { nombre: 'umbral', label: 'Umbral mínimo', tipo: 'number' as const, defecto: '10' },
    ],
    columnas: [
      { header: 'Producto', key: 'productoNombre' },
      { header: 'Categoría', key: 'categoriaNombre' },
      { header: 'Stock Actual', key: 'stockActual', formato: 'numero' as const },
    ],
    pdfFilename: 'stock-bajo',
    nota: 'Muestra productos con stock menor o igual al umbral configurado.',
  },
]

export default function ProductosPage() {
  return (
    <ReporteGenerico
      titulo="Productos"
      categoria="Reportes de productos, ventas por categoría y control de stock"
      reportes={reportes}
    />
  )
}
