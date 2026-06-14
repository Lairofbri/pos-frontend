import type { CocinaItem } from '../api'
import { Badge } from '../../../components/ui/Badge'

interface CocinaCardProps {
  item: CocinaItem
  onMarcarListo: (ordenId: string, itemId: string) => void
  onCompletada: (ordenId: string) => void
  onImprimir: (ordenId: string) => void
}

export function CocinaCard({ item, onMarcarListo, onCompletada, onImprimir }: CocinaCardProps) {
  const minutos = Math.floor(item.tiempo_transcurrido / 60)
  const tiempoColor =
    minutos > 20 ? 'danger' : minutos > 10 ? 'warning' : 'default'

  return (
    <div className="bg-bg-surface border-2 border-border rounded-xl p-4 space-y-3 hover:border-accent/50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-display text-base text-text-primary">
            Mesa {item.mesa_numero}
          </span>
          <span className="ml-2 text-[10px] uppercase text-text-secondary font-body">
            {item.zona}
          </span>
        </div>
        <Badge variant={tiempoColor}>
          {minutos < 1 ? '<1m' : `${minutos}m`}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {item.items.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-bg-primary"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-text-secondary font-semibold shrink-0">
                {i.cantidad}x
              </span>
              <span className="text-sm font-body text-text-primary truncate">
                {i.nombre}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {i.notas && (
                <span className="text-[10px] text-accent italic hidden sm:block" title={i.notas}>
                  "{i.notas}"
                </span>
              )}
              {i.estado === 'pendiente' && (
                <button
                  onClick={() => onMarcarListo(item.orden_id, i.id)}
                  className="text-[10px] px-2 py-1 rounded bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors cursor-pointer"
                >
                  Listo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1 border-t border-border">
        <button
          onClick={() => onCompletada(item.orden_id)}
          className="flex-1 text-xs py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors cursor-pointer font-body font-semibold"
        >
          Completada
        </button>
        <button
          onClick={() => onImprimir(item.orden_id)}
          className="text-xs py-1.5 px-3 rounded-lg bg-bg-primary text-text-secondary border border-border hover:text-text-primary transition-colors cursor-pointer"
        >
          🖨️
        </button>
      </div>
    </div>
  )
}
