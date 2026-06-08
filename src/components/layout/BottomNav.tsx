import { NavLink, useLocation } from 'react-router-dom'

const items = [
  { to: '/pos', label: 'POS', icon: '⚡' },
  { to: '/cocina', label: 'Cocina', icon: '🍳' },
  { to: '/admin/productos', label: 'Admin', icon: '⚙️' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="flex items-center justify-around bg-bg-surface border-t border-border px-2 py-1 shrink-0">
      {items.map((item) => {
        const isActive = location.pathname.startsWith(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-body font-semibold">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
