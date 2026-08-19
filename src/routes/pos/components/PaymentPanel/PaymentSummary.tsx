import { Banknote, CreditCard, ArrowLeftRight, Smartphone, ScrollText, Briefcase, TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PagoAcumulado {
  metodo: string
  monto: number
  referencia?: string
  banco?: string
}

interface PaymentSummaryProps {
  totalAPagar: number
  pagosAcumulados: PagoAcumulado[]
  onRemovePago: (index: number) => void
  onConfirmar: () => void
  loading?: boolean
}

const METODO_NAMES: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  tarjeta_debito: 'T. Débito',
  tarjeta_credito: 'T. Crédito',
  transferencia: 'Transferencia',
  bitcoin: 'Bitcoin',
  monedero_electronico: 'Monedero',
  cheque: 'Cheque',
  tarjeta_empresarial: 'T. Empresarial',
  bonos: 'Bonos',
  vales: 'Vales',
  otro: 'Otro',
}

function MetodoBadge({ metodo }: { metodo: string }) {
  const icons: Record<string, React.ReactNode> = {
    efectivo: <Banknote className="size-3.5" />,
    tarjeta: <CreditCard className="size-3.5" />,
    tarjeta_debito: <CreditCard className="size-3.5" />,
    tarjeta_credito: <CreditCard className="size-3.5" />,
    transferencia: <ArrowLeftRight className="size-3.5" />,
    bitcoin: <span className="text-xs font-bold">₿</span>,
    monedero_electronico: <Smartphone className="size-3.5" />,
    cheque: <ScrollText className="size-3.5" />,
    tarjeta_empresarial: <Briefcase className="size-3.5" />,
    bonos: <TicketPercent className="size-3.5" />,
    vales: <TicketPercent className="size-3.5" />,
  }
  return <>{icons[metodo] || <span className="text-xs">?</span>}</>
}

export function PaymentSummary({ totalAPagar, pagosAcumulados, onRemovePago, onConfirmar, loading }: PaymentSummaryProps) {
  const totalPagado = pagosAcumulados.reduce((s, p) => s + p.monto, 0)
  const faltante = Math.max(0, totalAPagar - totalPagado)
  const vuelto = Math.max(0, totalPagado - totalAPagar)
  const cubierto = totalPagado >= totalAPagar
  const pct = Math.min(100, Math.round((totalPagado / totalAPagar) * 100))

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <p className="text-xs text-text-secondary font-body uppercase tracking-wider">Pendiente</p>
        <p className="text-2xl font-mono text-accent font-bold">
          ${faltante > 0 ? faltante.toFixed(2) : totalAPagar.toFixed(2)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${cubierto ? 'bg-success' : 'bg-accent'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-text-secondary tabular-nums w-10 text-right">{pct}%</span>
      </div>

      {pagosAcumulados.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
          {pagosAcumulados.map((pago, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-bg-primary border border-border/50">
              <span className="text-text-secondary">
                <MetodoBadge metodo={pago.metodo} />
              </span>
              <span className="text-xs font-semibold text-text-primary flex-1">
                {METODO_NAMES[pago.metodo] || pago.metodo}
              </span>
              <span className="text-sm font-mono font-bold text-accent tabular-nums">
                ${pago.monto.toFixed(2)}
              </span>
              <button
                onClick={() => onRemovePago(i)}
                aria-label={`Eliminar pago de ${METODO_NAMES[pago.metodo] || pago.metodo}`}
                className="text-text-secondary/50 hover:text-danger transition-colors cursor-pointer touch-action-manipulation"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {cubierto && vuelto > 0 && (
        <div className="text-center py-2 rounded-lg bg-success/10 border border-success/30">
          <p className="text-[10px] text-text-secondary font-body uppercase tracking-wider">Vuelto</p>
          <p className="text-base font-mono text-success font-bold">${vuelto.toFixed(2)}</p>
        </div>
      )}

      {faltante > 0 && (
        <p className="text-[10px] text-text-secondary text-center">
          Falta: <span className="font-mono text-accent font-semibold">${faltante.toFixed(2)}</span>
        </p>
      )}

      <Button
        className="w-full"
        size="lg"
        loading={loading}
        disabled={!cubierto || pagosAcumulados.length === 0}
        onClick={onConfirmar}
      >
        Cobrar ${totalAPagar.toFixed(2)}
      </Button>
    </div>
  )
}
