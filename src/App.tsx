import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

import AuthLayout from './layouts/auth'
import ProtectedLayout from './layouts/protected'
import AdminLayout from './layouts/admin'

const LoginPage = lazy(() => import('./routes/login/index'))
const POSPage = lazy(() => import('./routes/pos/index'))
const CocinaPage = lazy(() => import('./routes/cocina/index'))
const ProductosPage = lazy(() => import('./routes/admin/productos/index'))
const CombosPage = lazy(() => import('./routes/admin/combos/index'))
const MesasPage = lazy(() => import('./routes/admin/mesas/index'))
const UsuariosPage = lazy(() => import('./routes/admin/usuarios/index'))
const RolesPage = lazy(() => import('./routes/configuraciones/roles/index'))
const ClientesPage = lazy(() => import('./routes/admin/clientes/index'))
const CajaPage = lazy(() => import('./routes/admin/caja/index'))
const MenusPage = lazy(() => import('./routes/configuraciones/menus/index'))
const ImpresorasPage = lazy(() => import('./routes/admin/impresoras/index'))
const InventarioPage = lazy(() => import('./routes/admin/inventario/index'))
const RecetasPage = lazy(() => import('./routes/admin/recetas/index'))
const SucursalesPage = lazy(() => import('./routes/admin/sucursales/index'))
const ReportesPage = lazy(() => import('./routes/admin/reportes/index'))
const RentabilidadDashboardPage = lazy(() => import('./routes/admin/rentabilidad/index'))
const VentasReportePage = lazy(() => import('./routes/admin/reportes/ventas/index'))
const ProductosReportePage = lazy(() => import('./routes/admin/reportes/productos/index'))
const OrdenesReportePage = lazy(() => import('./routes/admin/reportes/ordenes/index'))
const CajaReportePage = lazy(() => import('./routes/admin/reportes/caja/index'))
const CocinaReportePage = lazy(() => import('./routes/admin/reportes/cocina/index'))
const PropinasReportePage = lazy(() => import('./routes/admin/reportes/propinas/index'))
const SucursalesReportePage = lazy(() => import('./routes/admin/reportes/sucursales/index'))
const StaffReportePage = lazy(() => import('./routes/admin/reportes/staff/index'))
const DteReportePage = lazy(() => import('./routes/admin/reportes/dte/index'))
const ConsolidadosReportePage = lazy(() => import('./routes/admin/reportes/consolidados/index'))
const CostosReportePage = lazy(() => import('./routes/admin/reportes/costos/index'))
const DashboardPage = lazy(() => import('./routes/dashboard/index'))
import { AuthGuard } from './components/shared/AuthGuard'
import { RouteGuard } from './components/shared/RouteGuard'
import { CajaGuard } from './components/shared/CajaGuard'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/pos" replace /> },
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
  { path: '/dashboard', element: <AuthGuard><ProtectedLayout><DashboardPage /></ProtectedLayout></AuthGuard> },
  { path: '/pos', element: <AuthGuard><ProtectedLayout><CajaGuard><POSPage /></CajaGuard></ProtectedLayout></AuthGuard> },
  { path: '/cocina', element: <AuthGuard><ProtectedLayout><CocinaPage /></ProtectedLayout></AuthGuard> },
  { path: '/admin/productos', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><ProductosPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/categorias', element: <Navigate to="/admin/productos" replace /> },
  { path: '/admin/combos', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><CombosPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/mesas', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><MesasPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/usuarios', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><UsuariosPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/configuraciones/usuarios', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><UsuariosPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/configuraciones/roles', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><RolesPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/clientes', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><ClientesPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/caja', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><CajaPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/configuraciones/menus', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><MenusPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/impresoras', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><ImpresorasPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/inventario', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><InventarioPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/recetas', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><RecetasPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/sucursales', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><SucursalesPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><ReportesPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/rentabilidad', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><RentabilidadDashboardPage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/ventas', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><VentasReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/productos', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><ProductosReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/ordenes', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><OrdenesReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/caja', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><CajaReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/cocina', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><CocinaReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/propinas', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><PropinasReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/sucursales', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><SucursalesReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/staff', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><StaffReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/dte', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><DteReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/consolidados', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><ConsolidadosReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '/admin/reportes/costos', element: <AuthGuard><RouteGuard><ProtectedLayout><AdminLayout><CostosReportePage /></AdminLayout></ProtectedLayout></RouteGuard></AuthGuard> },
  { path: '*', element: <Navigate to="/pos" replace /> },
])

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LoaderCircle className="size-8 text-pos-accent animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  )
}
