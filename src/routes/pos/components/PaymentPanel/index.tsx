import { useState, useMemo } from 'react'
import { ArrowLeft, ChevronRight, Banknote, CreditCard, ArrowLeftRight, Smartphone, ScrollText, Briefcase, TicketPercent } from 'lucide-react'
import { useCatalogo } from '../../../../hooks/useCatalogo'
import type { Orden } from '../../../../types'
import { PaymentMethodTabs } from './PaymentMethodTabs'
import { BillButtons } from './BillButtons'
import { NumericKeypad } from '../../../../components/shared/NumericKeypad'
import { Button } from '@/components/ui/Button'

interface PagoAcumulado {
  metodo: string
  monto: number
  referencia?: string
  banco?: string
}

interface PaymentPanelProps {
  onClose: () => void
  orden: Orden
  onConfirmar: (metodos: PagoAcumulado[]) => void
  loading?: boolean
  numPersonas?: number
  clienteNombre?: string
  clienteEsJuridico?: boolean
}

const METODO_NAMES: Record<string, string> = {
  efectivo: 'Efectivo', tarjeta: 'Tarjeta', tarjeta_debito: 'T. Débito',
  tarjeta_credito: 'T. Crédito', transferencia: 'Transferencia', bitcoin: 'Bitcoin',
  monedero_electronico: 'Monedero', cheque: 'Cheque', tarjeta_empresarial: 'T. Empresarial',
  bonos: 'Bonos', vales: 'Vales', otro: 'Otro',
}

function MetodoIcon({ metodo }: { metodo: string }) {
  const icons: Record<string, React.ReactNode> = {
    efectivo: <Banknote className="size-4" />,
    tarjeta: <CreditCard className="size-4" />,
    tarjeta_debito: <CreditCard className="size-4" />,
    tarjeta_credito: <CreditCard className="size-4" />,
    transferencia: <ArrowLeftRight className="size-4" />,
    bitcoin: <span className="text-sm font-bold w-4 text-center">₿</span>,
    monedero_electronico: <Smartphone className="size-4" />,
    cheque: <ScrollText className="size-4" />,
    tarjeta_empresarial: <Briefcase className="size-4" />,
    bonos: <TicketPercent className="size-4" />,
    vales: <TicketPercent className="size-4" />,
  }
  return <span className="text-text-secondary shrink-0">{icons[metodo] || '?'}</span>
}

export function PaymentPanel({ onClose, orden, onConfirmar, loading, numPersonas = 1, clienteNombre, clienteEsJuridico }: PaymentPanelProps) {
  const [metodoActivo, setMetodoActivo] = useState('efectivo')
  const [pagosAcumulados, setPagosAcumulados] = useState<PagoAcumulado[]>([])
  const [montoActual, setMontoActual] = useState('')
  const { data: metodosData } = useCatalogo('metodos_pago')

  const totalAPagar = orden.total + orden.propina_monto

  const totalPagado = useMemo(
    () => pagosAcumulados.reduce((s, p) => s + p.monto, 0),
    [pagosAcumulados],
  )

  const faltante = Math.max(0, totalAPagar - totalPagado)
  const vuelto = Math.max(0, totalPagado - totalAPagar)
  const cubierto = totalPagado >= totalAPagar && pagosAcumulados.length > 0
  const esEfectivo = metodoActivo === 'efectivo'

  const handleDigit = (d: string) => {
    const current = montoActual
    if (d === '.' && current.includes('.')) return
    if (current.includes('.') && current.split('.')[1].length >= 2) return
    if (current === '0' && d !== '.') { setMontoActual(d); return }
    setMontoActual(current + d)
  }

  const handleBackspace = () => setMontoActual((prev) => prev.slice(0, -1))
  const handleClear = () => setMontoActual('')

  const handleEnter = () => {
    const monto = parseFloat(montoActual)
    if (isNaN(monto) || monto <= 0) return
    setPagosAcumulados((prev) => [...prev, { metodo: metodoActivo, monto }])
    setMontoActual('')
  }

  const handleBillSelect = (amount: number) => {
    setPagosAcumulados((prev) => [...prev, { metodo: 'efectivo', monto: amount }])
    setMontoActual('')
  }

  const handleRemovePago = (index: number) => {
    setPagosAcumulados((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMetodoChange = (nuevo: string) => {
    setMetodoActivo(nuevo)
    setMontoActual('')
    if (nuevo !== 'efectivo' && faltante > 0) {
      setMontoActual(faltante.toFixed(2))
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden px-4 lg:px-6 lg:py-4">
      {/* Stepper header */}
        <div className="flex items-center gap-3 shrink-0 pb-3 border-b border-border/40">
        <button type="button" onClick={onClose} aria-label="Volver a la venta"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors cursor-pointer touch-action-manipulation shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Volver</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary/60 font-mono min-w-0">
          <span>Venta</span><ChevronRight className="size-3 shrink-0" /><span className="text-accent font-semibold">Pago</span>
        </div>
        <div className="flex-1" />
        {clienteNombre && (
          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary shrink-0">
            <span className="text-text-secondary/60">Cliente:</span>
            <span className="font-semibold text-text-primary truncate max-w-[120px]">{clienteNombre}</span>
          </div>
        )}
        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
          clienteEsJuridico ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-accent/10 text-accent border border-accent/20'
        }`}>
          {clienteEsJuridico ? 'DTE: CCF' : 'DTE: FCF'}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_auto] gap-5 min-h-0 pt-3">
        {/* Left: Bills + Numpad + Summary */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto overscroll-behavior-contain">
          {/* TOTAL */}
          <div className="text-center">
            <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Total a pagar</span>
            <p className="text-3xl font-mono font-bold text-accent tabular-nums">${totalAPagar.toFixed(2)}</p>
          </div>

          {/* Amount input (non-efectivo) */}
          {!esEfectivo && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold shrink-0">
                {METODO_NAMES[metodoActivo] || metodoActivo}:
              </span>
              <div className="flex-1 h-10 flex items-center px-3 rounded-lg bg-bg-primary border-2 border-border font-mono text-lg text-accent font-bold tabular-nums">
                {montoActual || '0.00'}
              </div>
            </div>
          )}

          {/* Bills + Numpad side by side */}
          <div className="flex gap-4 justify-center">
            {esEfectivo && (
              <BillButtons onSelect={handleBillSelect} totalAPagar={totalAPagar} />
            )}
            <NumericKeypad
              onDigit={handleDigit}
              onClear={handleClear}
              onBackspace={handleBackspace}
              onEnter={handleEnter}
            />
          </div>

          {/* Method tabs */}
          {metodosData && (
            <PaymentMethodTabs
              metodos={metodosData}
              selected={metodoActivo}
              onSelect={handleMetodoChange}
            />
          )}
        </div>

        {/* Right: Summary column */}
        <div className="lg:w-[220px] shrink-0 flex flex-col gap-3 justify-end">
          {/* Accumulated payments list */}
          {pagosAcumulados.length > 0 && (
            <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto">
              {pagosAcumulados.map((pago, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-primary border border-border/40 text-sm">
                  <MetodoIcon metodo={pago.metodo} />
                  <span className="font-medium text-text-primary flex-1 min-w-0">
                    {METODO_NAMES[pago.metodo] || pago.metodo}
                  </span>
                  <span className="font-mono font-bold text-accent tabular-nums shrink-0">
                    ${pago.monto.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleRemovePago(i)}
                    aria-label={`Eliminar pago de ${METODO_NAMES[pago.metodo] || pago.metodo}`}
                    className="text-text-secondary/40 hover:text-danger transition-colors cursor-pointer touch-action-manipulation shrink-0 text-base"
                  >&times;</button>
                </div>
              ))}
            </div>
          )}
          {numPersonas > 1 && (
            <div className="text-center py-1 px-2 rounded-md bg-bg-primary border border-border/30">
              <span className="text-[10px] text-text-secondary">👤 {numPersonas} personas</span>
              <span className="text-[10px] text-text-secondary/60 font-mono ml-1">${(totalAPagar / numPersonas).toFixed(2)}/pers</span>
            </div>
          )}
          {/* RECIBIDO / RESTANTE */}
          <div className="flex flex-col gap-2">
            <div className="py-2 px-3 rounded-lg bg-bg-primary border border-border/50 text-center">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Recibido</span>
              <p className="text-lg font-mono font-bold text-accent tabular-nums">${totalPagado.toFixed(2)}</p>
            </div>
            {cubierto && vuelto > 0 ? (
              <div className="py-2 px-3 rounded-lg bg-success/10 border border-success/30 text-center">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Cambio</span>
                <p className="text-lg font-mono font-bold text-success tabular-nums">${vuelto.toFixed(2)}</p>
              </div>
            ) : faltante > 0 ? (
              <div className="py-2 px-3 rounded-lg bg-accent/5 border border-accent/20 text-center">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Restante</span>
                <p className="text-lg font-mono font-bold text-accent tabular-nums">${faltante.toFixed(2)}</p>
              </div>
            ) : null}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${cubierto ? 'bg-success' : 'bg-accent'}`}
                style={{ width: `${Math.min(100, Math.round((totalPagado / totalAPagar) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-text-secondary tabular-nums w-9 text-right">
              {Math.min(100, Math.round((totalPagado / totalAPagar) * 100))}%
            </span>
          </div>

          {/* COBRAR */}
          <Button
            className="w-full h-12 text-base font-bold"
            size="lg"
            loading={loading}
            disabled={!cubierto}
            onClick={() => onConfirmar(pagosAcumulados)}
          >
            Cobrar ${totalAPagar.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  )
}
