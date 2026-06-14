import { useState } from 'react'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Button } from '../../../components/ui/Button'
import { useCatalogo } from '../../../hooks/useCatalogo'
import type { Orden } from '../../../types'

interface PaymentPanelProps {
  open: boolean
  onClose: () => void
  orden: Orden | null
  onConfirmar: (data: { metodo: string; monto_efectivo?: number; monto_tarjeta?: number; referencia_tarjeta?: string }) => void
  loading?: boolean
}

const iconosMetodo: Record<string, string> = {
  efectivo: '💵',
  tarjeta: '💳',
  mixto: '💳💵',
}

export function PaymentPanel({ open, onClose, orden, onConfirmar, loading }: PaymentPanelProps) {
  const [metodo, setMetodo] = useState('efectivo')
  const { data: metodos } = useCatalogo('metodos_pago')
  const [montoEfectivo, setMontoEfectivo] = useState('')
  const [montoTarjeta, setMontoTarjeta] = useState('')
  const [referenciaTarjeta, setReferenciaTarjeta] = useState('')

  if (!orden) return null

  const efectivo = parseFloat(montoEfectivo || '0')
  const tarjeta = parseFloat(montoTarjeta || '0')
  const totalPagado = metodo === 'mixto' ? efectivo + tarjeta : efectivo || tarjeta
  const cambio = metodo === 'efectivo' || metodo === 'mixto'
    ? Math.max(0, totalPagado - orden.total)
    : 0

  const buildPayload = (): { metodo: string; monto_efectivo?: number; monto_tarjeta?: number; referencia_tarjeta?: string } => {
    switch (metodo) {
      case 'efectivo':
        return { metodo, monto_efectivo: efectivo || undefined }
      case 'tarjeta':
        return { metodo, monto_tarjeta: orden.total, referencia_tarjeta: referenciaTarjeta || undefined }
      case 'mixto':
        return { metodo, monto_efectivo: efectivo || undefined, monto_tarjeta: tarjeta || undefined, referencia_tarjeta: referenciaTarjeta || undefined }
      default:
        return { metodo: 'efectivo' }
    }
  }

  return (
    <SidePanel open={open} onClose={onClose} title="Pago">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-xs text-text-secondary font-body uppercase tracking-wider">Total a pagar</p>
          <p className="text-3xl font-mono text-accent font-bold mt-1">${orden.total?.toFixed(2) ?? '0.00'}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
            Método de pago
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(metodos ?? []).map((m) => (
              <button
                key={m.valor}
                onClick={() => setMetodo(m.valor)}
                className={`p-3 rounded-xl border-2 text-sm font-body transition-all duration-200 cursor-pointer ${
                  metodo === m.valor
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-secondary hover:border-accent/50'
                }`}
              >
                {iconosMetodo[m.valor] ?? ''} {m.label}
              </button>
            ))}
          </div>
        </div>

        {(metodo === 'efectivo' || metodo === 'mixto') && (
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
              {metodo === 'mixto' ? 'Monto en efectivo' : 'Monto recibido'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={montoEfectivo}
              onChange={(e) => setMontoEfectivo(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              className="w-full bg-bg-primary border-2 border-border rounded-lg px-4 py-3 text-xl font-mono text-text-primary outline-none focus:border-accent text-center"
            />
          </div>
        )}

        {(metodo === 'tarjeta' || metodo === 'mixto') && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                {metodo === 'mixto' ? 'Monto en tarjeta' : 'Monto a cobrar'}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={metodo === 'tarjeta' ? orden.total.toString() : montoTarjeta}
                onChange={(e) => setMontoTarjeta(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className={`w-full bg-bg-primary border-2 border-border rounded-lg px-4 py-3 text-xl font-mono text-text-primary outline-none focus:border-accent text-center ${metodo === 'tarjeta' ? 'opacity-60' : ''}`}
                readOnly={metodo === 'tarjeta'}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
                Referencia (opcional)
              </label>
              <input
                type="text"
                value={referenciaTarjeta}
                onChange={(e) => setReferenciaTarjeta(e.target.value)}
                placeholder="Últimos 4 dígitos"
                className="w-full bg-bg-primary border-2 border-border rounded-lg px-4 py-2.5 text-sm font-mono text-text-primary outline-none focus:border-accent"
                maxLength={20}
              />
            </div>
          </div>
        )}

        {cambio > 0 && (
          <div className="text-center py-2 rounded-xl bg-success/10 border border-success/30">
            <p className="text-xs text-text-secondary font-body">Cambio</p>
            <p className="text-xl font-mono text-success font-bold">${cambio.toFixed(2)}</p>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          loading={loading}
          onClick={() => onConfirmar(buildPayload())}
        >
          Confirmar Pago
        </Button>
      </div>
    </SidePanel>
  )
}
