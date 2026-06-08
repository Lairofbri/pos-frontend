import { useQuery } from '@tanstack/react-query'
import { NavLink, useLocation } from 'react-router-dom'
import api from '../../api/client'
import { useSidebar } from '../../hooks/useSidebar'
import type { MenuItem } from '../../types'

const iconMap: Record<string, string> = {
  'shopping-cart': '⚡',
  'chef-hat': '🍳',
  'settings': '⚙️',
  'package': '📦',
  'gift': '🎁',
  'users': '👥',
  'shield': '🛡️',
  'dollar-sign': '💰',
  'user': '👤',
}

export function Sidebar() {
  const { collapsed, toggle } = useSidebar()
  const location = useLocation()

  const { data } = useQuery<{ ok: boolean; data: MenuItem[] }>({
    queryKey: ['menus'],
    queryFn: () => api.get('/menus').then(r => r.data),
  })

  const menus = data?.data ?? []

  return (
    <aside
      className={`flex flex-col bg-bg-surface border-r border-border transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="h-14 flex items-center justify-center gap-2 border-b border-border">
        {!collapsed && (
          <span className="font-display text-lg text-accent tracking-wider">AMBER</span>
        )}
        {collapsed && (
          <span className="font-display text-sm text-accent">A</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menus.map((menu) => (
          <MenuItem key={menu.id} item={menu} collapsed={collapsed} currentPath={location.pathname} />
        ))}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors cursor-pointer text-sm"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <span>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  )
}

function MenuItem({
  item,
  collapsed,
  currentPath,
}: {
  item: MenuItem
  collapsed: boolean
  currentPath: string
}) {
  if (item.children.length > 0) {
    return (
      <div>
        {!collapsed && (
          <span className="block px-3 py-1.5 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
            {item.titulo}
          </span>
        )}
        <div className={collapsed ? '' : 'space-y-0.5'}>
          {item.children.map((child) => (
            <MenuItem
              key={child.id}
              item={child}
              collapsed={collapsed}
              currentPath={currentPath}
            />
          ))}
        </div>
      </div>
    )
  }

  const isActive = currentPath === item.ruta

  return (
    <NavLink
      to={item.ruta ?? '#'}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
        isActive
          ? 'bg-accent/10 text-accent border border-accent/30'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover border border-transparent'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? item.titulo : undefined}
    >
      <span className="w-5 h-5 flex items-center justify-center text-base shrink-0">
        {iconMap[item.icono] || '•'}
      </span>
      {!collapsed && <span>{item.titulo}</span>}
    </NavLink>
  )
}
