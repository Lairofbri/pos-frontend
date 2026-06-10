import type { Orden } from '../../../types'
import { Button } from '../../../components/ui/Button'

interface TicketPanelProps {
  orden: Orden | null
  onEliminarItem: (itemId: string) => void
  onEnviarCocina: () => void
  onPagar: () => void
  enviando?: boolean
}

export function TicketPanel({
  orden,
  onEliminarItem,
  onEnviarCocina,
  onPagar,
  enviando,
}: TicketPanelProps) {
  if (!orden) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-text-secondary">
        <span className="text-4xl">🪑</span>
        <p className="text-sm font-body">Selecciona una mesa</p>
      </div>
    )
  }

  const tieneItemsPendientes = (orden.items ?? []).some(
    (i) => i.estado === 'pendiente'
  )

  return (
    <div className="h-full flex flex-col bg-bg-surface rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-display text-lg text-text-primary">
              Mesa {orden.mesa_numero}
            </span>
            <span className="ml-2 text-xs text-text-secondary uppercase font-body">
              {orden.zona}
            </span>
          </div>
          {orden.cliente_nombre && (
            <span className="text-xs text-text-secondary font-body">
              {orden.cliente_nombre}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {orden.items.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8 font-body">
            Agrega productos tocándolos
          </p>
        ) : (
          orden.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-bg-primary border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-secondary font-semibold">
                    {item.cantidad}x
                  </span>
                  <span className="text-sm font-body text-text-primary truncate">
                    {item.nombre}
                  </span>
                </div>
                {item.notas && (
                  <p className="text-[11px] text-text-secondary mt-0.5 italic">
                    {item.notas}
                  </p>
                )}
                {item.modificadores?.map((m) => (
                  <span
                    key={m}
                    className="inline-block mr-1 mt-0.5 text-[10px] text-teal bg-teal/10 px-1.5 py-0.5 rounded"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-mono text-text-primary font-semibold">
                  ${((item.precio_unitario ?? 0) * item.cantidad).toFixed(2)}
                </span>
                <button
                  onClick={() => onEliminarItem(item.id)}
                  className="text-text-secondary hover:text-danger transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-body text-text-secondary">Subtotal</span>
          <span className="text-sm font-mono text-text-primary">
            ${orden.total?.toFixed(2) ?? '0.00'}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-body text-text-primary font-semibold">Total</span>
          <span className="text-lg font-mono text-accent font-bold">
            ${orden.total?.toFixed(2) ?? '0.00'}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onEnviarCocina}
            disabled={!tieneItemsPendientes || enviando}
            loading={enviando}
          >
            Enviar Cocina
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={onPagar}
            disabled={orden.items.length === 0}
          >
            Pagar
          </Button>
        </div>
      </div>
    </div>
  )
}
