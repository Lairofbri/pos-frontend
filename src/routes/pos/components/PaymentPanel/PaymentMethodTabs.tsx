import {
  Banknote, CreditCard, ArrowLeftRight, Smartphone,
  ScrollText, Briefcase, TicketPercent, Ellipsis,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CatalogoItem } from '../../../../hooks/useCatalogo'

interface PaymentMethodTabsProps {
  metodos: CatalogoItem[]
  selected: string
  onSelect: (valor: string) => void
}

const METODO_ICON_MAP: Record<string, typeof Banknote> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  tarjeta_debito: CreditCard,
  tarjeta_credito: CreditCard,
  transferencia: ArrowLeftRight,
  bitcoin: Banknote,
  monedero_electronico: Smartphone,
  cheque: ScrollText,
  tarjeta_empresarial: Briefcase,
  bonos: TicketPercent,
  vales: TicketPercent,
  otro: Ellipsis,
}

function MetodoIcon({ metodo }: { metodo: string }) {
  if (metodo === 'bitcoin') {
    return <span className="text-sm font-bold">₿</span>
  }
  const Icon = METODO_ICON_MAP[metodo] || Banknote
  return <Icon className="size-4" />
}

export function PaymentMethodTabs({ metodos, selected, onSelect }: PaymentMethodTabsProps) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {metodos.map((m) => {
        const isSelected = selected === m.valor
        return (
          <button
            key={m.valor}
            type="button"
            onClick={() => onSelect(m.valor)}
            className={cn(
              'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer touch-action-manipulation',
              isSelected
                ? 'bg-accent text-white shadow-sm'
                : 'bg-bg-primary text-text-secondary border border-border hover:border-accent/40 hover:text-accent',
            )}
          >
            <MetodoIcon metodo={m.valor} />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
