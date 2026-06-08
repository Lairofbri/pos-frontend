import { useState } from 'react'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Button } from '../../../components/ui/Button'
import type { Orden } from '../../../types'

interface PaymentPanelProps {
  open: boolean
  onClose: () => void
  orden: Orden | null
  onConfirmar: (data: { metodo: string; monto_recibido?: number; split?: number }) => void
  loading?: boolean
}

const metodos = [
  { id: 'efectivo', label: '💵 Efectivo' },
  { id: 'tarjeta', label: '💳 Tarjeta' },
  { id: 'transferencia', label: '📱 Transferencia' },
]

export function PaymentPanel({ open, onClose, orden, onConfirmar, loading }: PaymentPanelProps) {
  const [metodo, setMetodo] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [split, setSplit] = useState(1)

  if (!orden) return null

  const cambio = metodo === 'efectivo' && montoRecibido
    ? Math.max(0, parseFloat(montoRecibido || '0') - orden.total)
    : 0

  return (
    <SidePanel open={open} onClose={onClose} title="Pago">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-xs text-text-secondary font-body uppercase tracking-wider">Total a pagar</p>
          <p className="text-3xl font-mono text-accent font-bold mt-1">${orden.total.toFixed(2)}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
            Método de pago
          </label>
          <div className="grid grid-cols-2 gap-2">
            {metodos.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetodo(m.id)}
                className={`p-3 rounded-xl border-2 text-sm font-body transition-all duration-200 cursor-pointer ${
                  metodo === m.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-secondary hover:border-accent/50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {metodo === 'efectivo' && (
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
              Monto recibido
            </label>
            <input
              type="number"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              placeholder="0.00"
              className="w-full bg-bg-primary border-2 border-border rounded-lg px-4 py-3 text-xl font-mono text-text-primary outline-none focus:border-accent text-center"
              step="0.01"
              min="0"
            />
            {cambio > 0 && (
              <p className="text-sm text-teal font-mono text-center mt-2">
                Cambio: ${cambio.toFixed(2)}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
            Dividir cuenta
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSplit(Math.max(1, split - 1))}
              className="w-10 h-10 rounded-lg bg-bg-primary border border-border text-text-primary hover:border-accent transition-colors cursor-pointer text-lg"
              disabled={split <= 1}
            >
              −
            </button>
            <span className="font-mono text-lg text-text-primary w-8 text-center">{split}</span>
            <button
              onClick={() => setSplit(Math.min(10, split + 1))}
              className="w-10 h-10 rounded-lg bg-bg-primary border border-border text-text-primary hover:border-accent transition-colors cursor-pointer text-lg"
              disabled={split >= 10}
            >
              +
            </button>
            <span className="text-xs text-text-secondary font-body">personas</span>
          </div>
          {split > 1 && (
            <p className="text-xs text-text-secondary font-body text-center mt-2">
              ${(orden.total / split).toFixed(2)} c/u
            </p>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          loading={loading}
          onClick={() =>
            onConfirmar({
              metodo,
              monto_recibido: metodo === 'efectivo' ? parseFloat(montoRecibido || '0') : undefined,
              split: split > 1 ? split : undefined,
            })
          }
        >
          Confirmar Pago
        </Button>
      </div>
    </SidePanel>
  )
}
