import { Outlet, useLocation } from 'react-router-dom'
import { PageHeader } from '../components/shared/PageHeader'

const titles: Record<string, string> = {
  '/admin/productos': 'Productos',
  '/admin/categorias': 'Categorías',
  '/admin/combos': 'Combos',
  '/admin/mesas': 'Mesas',
  '/admin/usuarios': 'Usuarios',
  '/admin/roles': 'Roles',
  '/admin/clientes': 'Clientes',
  '/admin/caja': 'Caja',
}

export default function AdminLayout() {
  const location = useLocation()
  const title = titles[location.pathname] || 'Administración'

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={title} />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
