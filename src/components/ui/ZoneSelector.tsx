import { useZoneStore } from '../../store/zoneStore'
import { useCatalogo } from '../../hooks/useCatalogo'

export function ZoneSelector() {
  const zona = useZoneStore((s) => s.zona)
  const setZona = useZoneStore((s) => s.setZona)
  const { data: zonas } = useCatalogo('zonas')

  return (
    <div className="flex bg-bg-primary rounded-lg p-0.5 border border-border">
      {(zonas ?? []).map((z) => (
        <button
          key={z.valor}
          onClick={() => setZona(z.valor)}
          className={`px-3 py-1 rounded-md text-xs font-body font-semibold transition-all duration-200 cursor-pointer ${
            zona === z.valor
              ? 'bg-pos-accent text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {z.label}
        </button>
      ))}
    </div>
  )
}
