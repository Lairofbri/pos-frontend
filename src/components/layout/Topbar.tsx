import { useAuthStore } from '../../store/authStore'
import { useZoneStore } from '../../store/zoneStore'
import { Badge } from '../ui/Badge'

export function Topbar() {
  const usuario = useAuthStore((s) => s.usuario)
  const { zona, setZona } = useZoneStore()

  const zonas = [
    { value: 'salon', label: 'Salón' },
    { value: 'bar', label: 'Bar' },
    { value: 'evento', label: 'Evento' },
  ]

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-bg-surface/50 glass shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex bg-bg-primary rounded-lg p-0.5 border border-border">
          {zonas.map((z) => (
            <button
              key={z.value}
              onClick={() => setZona(z.value)}
              className={`px-3 py-1 rounded-md text-xs font-body font-semibold transition-all duration-200 cursor-pointer ${
                zona === z.value
                  ? 'bg-accent text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="success">Caja: $0.00</Badge>
        <span className="text-xs text-text-secondary font-mono">
          {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-sm text-text-primary font-body font-medium">
          {usuario?.nombre || 'Usuario'}
        </span>
      </div>
    </header>
  )
}
