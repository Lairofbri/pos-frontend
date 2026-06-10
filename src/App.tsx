import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import AuthLayout from './layouts/auth'
import ProtectedLayout from './layouts/protected'
import AdminLayout from './layouts/admin'

import LoginPage from './routes/login/index'
import POSPage from './routes/pos/index'
import CocinaPage from './routes/cocina/index'
import ProductosPage from './routes/admin/productos/index'
import CategoriasPage from './routes/admin/categorias/index'
import CombosPage from './routes/admin/combos/index'
import MesasPage from './routes/admin/mesas/index'
import UsuariosPage from './routes/admin/usuarios/index'
import RolesPage from './routes/configuraciones/roles/index'
import ClientesPage from './routes/admin/clientes/index'
import CajaPage from './routes/admin/caja/index'
import MenusPage from './routes/configuraciones/menus/index'

const queryClient = new QueryClient()

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/pos" replace /> },
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
  { path: '/pos', element: <AuthGuard><ProtectedLayout><POSPage /></ProtectedLayout></AuthGuard> },
  { path: '/cocina', element: <AuthGuard><ProtectedLayout><CocinaPage /></ProtectedLayout></AuthGuard> },
  { path: '/admin/productos', element: <AuthGuard><ProtectedLayout><AdminLayout><ProductosPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '/admin/categorias', element: <AuthGuard><ProtectedLayout><AdminLayout><CategoriasPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '/admin/combos', element: <AuthGuard><ProtectedLayout><AdminLayout><CombosPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '/admin/mesas', element: <AuthGuard><ProtectedLayout><AdminLayout><MesasPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '/admin/usuarios', element: <AuthGuard><ProtectedLayout><AdminLayout><UsuariosPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '/configuraciones/roles', element: <AuthGuard><ProtectedLayout><AdminLayout><RolesPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '/admin/clientes', element: <AuthGuard><ProtectedLayout><AdminLayout><ClientesPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '/admin/caja', element: <AuthGuard><ProtectedLayout><AdminLayout><CajaPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '/configuraciones/menus', element: <AuthGuard><ProtectedLayout><AdminLayout><MenusPage /></AdminLayout></ProtectedLayout></AuthGuard> },
  { path: '*', element: <Navigate to="/pos" replace /> },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
