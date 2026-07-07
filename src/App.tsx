import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

import AuthLayout from './layouts/auth'
import ProtectedLayout from './layouts/protected'
import AdminLayout from './layouts/admin'

import LoginPage from './routes/login/index'
import POSPage from './routes/pos/index'
import CocinaPage from './routes/cocina/index'
import ProductosPage from './routes/admin/productos/index'
import CombosPage from './routes/admin/combos/index'
import MesasPage from './routes/admin/mesas/index'
import UsuariosPage from './routes/admin/usuarios/index'
import RolesPage from './routes/configuraciones/roles/index'
import ClientesPage from './routes/admin/clientes/index'
import CajaPage from './routes/admin/caja/index'
import MenusPage from './routes/configuraciones/menus/index'
import { AuthGuard } from './components/shared/AuthGuard'
import { RouteGuard } from './components/shared/RouteGuard'
import { CajaGuard } from './components/shared/CajaGuard'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/pos" replace /> },
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
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
  { path: '*', element: <Navigate to="/pos" replace /> },
])

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
