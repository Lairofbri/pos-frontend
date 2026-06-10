import { useZoneStore } from '../../store/zoneStore'

const zonas = [
  { value: 'salon', label: 'Salón' },
  { value: 'bar', label: 'Bar' },
  { value: 'evento', label: 'Evento' },
]

export function ZoneSelector() {
  const zona = useZoneStore((s) => s.zona)
  const setZona = useZoneStore((s) => s.setZona)

  return (
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
  )
}
