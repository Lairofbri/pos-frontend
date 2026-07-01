import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { NavLink, useLocation } from 'react-router-dom'
import api from '../../api/client'
import { useSidebar } from '../../hooks/useSidebar'
import { useAuthStore } from '../../store/authStore'
import { Icon } from '../shared/Icon'
import type { MenuItem } from '../../types'

function SidebarNav({
  menus,
  expanded,
  onToggleGroup,
  openGroupId,
  currentPath,
}: {
  menus: MenuItem[]
  expanded: boolean
  onToggleGroup: (id: string) => void
  openGroupId: string | null
  currentPath: string
}) {
  return (
    <nav className="flex-1 overflow-y-auto p-2 space-y-1">
      {menus.map((menu, idx) => (
        <div key={menu.id}>
          {menu.children.length > 0 ? (
            <>
              <button
                onClick={() => onToggleGroup(menu.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer border border-transparent
                  ${expanded ? 'justify-start text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover hover:border-accent/10' : 'justify-center hover:bg-bg-surface-hover'}`}
                title={!expanded ? menu.titulo : undefined}
              >
                <span className="w-6 h-6 flex items-center justify-center shrink-0">
                  <Icon name={menu.icono} className="w-6 h-6 shrink-0" />
                </span>
                {expanded && (
                  <>
                    <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-widest">
                      {menu.titulo}
                    </span>
                    <span className={`text-[10px] transition-transform duration-200 ${openGroupId === menu.id ? 'rotate-90' : ''}`}>
                      ▸
                    </span>
                  </>
                )}
              </button>

              {expanded && openGroupId === menu.id && (
                <div className="ml-2 space-y-0.5 mt-0.5 mb-1 pl-3 border-l border-border/50">
                  {menu.children.map((child) => (
                    <NavItem key={child.id} item={child} expanded={expanded} currentPath={currentPath} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavItem item={menu} expanded={expanded} currentPath={currentPath} />
          )}
          {expanded && idx < menus.length - 1 && menu.children.length === 0 && menus[idx + 1]?.children.length === 0 && (
            <hr className="border-border/50 my-1" />
          )}
        </div>
      ))}
    </nav>
  )
}

function NavItem({ item, expanded, currentPath }: { item: MenuItem; expanded: boolean; currentPath: string }) {
  const isActive = currentPath === item.ruta

  return (
    <NavLink
      to={item.ruta ?? '#'}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group active:scale-[0.97] ${
        isActive
          ? 'border-l-2 border-accent bg-accent/[0.06] text-accent'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover hover:translate-x-0.5 border-l-2 border-transparent'
      } ${expanded ? 'justify-start' : 'justify-center border-l-0'}`}
      title={!expanded ? item.titulo : undefined}
    >
      <span className="w-6 h-6 flex items-center justify-center shrink-0">
        <Icon name={item.icono} className="w-6 h-6 shrink-0" />
      </span>
      {expanded && (
        <span className="text-[13px] font-body">{item.titulo}</span>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebar()
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  const { data } = useQuery<{ ok: boolean; data: { menus: MenuItem[] } }>({
    queryKey: ['menus'],
    queryFn: () => api.get('/menus').then(r => r.data),
    ...queryDefaults('menus'),
    enabled: !!token,
  })

  const rawMenus = data?.data?.menus ?? []

  const standaloneItems = rawMenus.filter((m) => m.children.length === 0 && m.ruta)
  const groupsFromApi = rawMenus.filter((m) => m.children.length > 0 || !m.ruta)

  const menus = standaloneItems.length > 0
    ? [{ id: '__principal', titulo: 'Principal', icono: 'layout-dashboard', ruta: null, orden: 0, children: standaloneItems }, ...groupsFromApi]
    : rawMenus

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-svh z-50 flex flex-col bg-bg-surface border-r border-border transition-transform duration-300 ease-out md:hidden w-56 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          <span className="font-display text-lg text-accent tracking-wider">AMBER</span>
          <button onClick={() => setMobileOpen(false)} className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-lg">✕</button>
        </div>
        <SidebarNav menus={menus} expanded={true} onToggleGroup={(id) => setOpenGroupId(openGroupId === id ? null : id)} openGroupId={openGroupId} currentPath={location.pathname} />
      </aside>

      <aside className={`hidden md:flex flex-col bg-bg-surface border-r border-border transition-all duration-300 shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>
        <div className="h-14 flex items-center justify-center border-b border-border shrink-0">
          {collapsed ? (
            <span className="font-display text-sm text-accent tracking-wider glow-terracota px-2">A</span>
          ) : (
            <span className="font-display text-lg text-accent tracking-wider">AMBER</span>
          )}
        </div>
        <SidebarNav menus={menus} expanded={!collapsed} onToggleGroup={(id) => setOpenGroupId(openGroupId === id ? null : id)} openGroupId={openGroupId} currentPath={location.pathname} />
        <div className="p-2 border-t border-border shrink-0">
          <button onClick={toggle} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors cursor-pointer text-sm group" title={collapsed ? 'Expandir' : 'Colapsar'}>
            <span className="transition-transform duration-200 group-hover:scale-110">{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
