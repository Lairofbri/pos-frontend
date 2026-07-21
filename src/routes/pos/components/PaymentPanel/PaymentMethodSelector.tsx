import type { CatalogoItem } from '../../../../hooks/useCatalogo'
import { METODOS_CONFIG } from './metodos'

interface PaymentMethodSelectorProps {
  metodos: CatalogoItem[]
  selected: string
  onSelect: (valor: string) => void
}

export function PaymentMethodSelector({ metodos, selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5 block">
        Método de pago
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {metodos.map((m) => {
          const icono = METODOS_CONFIG[m.valor]?.icono ?? '💳'
          const isSelected = selected === m.valor
          return (
            <button
              key={m.valor}
              type="button"
              onClick={() => onSelect(m.valor)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-body transition-all duration-200 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'border-accent bg-accent/10 text-accent shadow-sm'
                  : 'border-border text-text-secondary hover:border-accent/50 hover:bg-bg-secondary/50'
              }`}
            >
              <span className="text-lg leading-none">{icono}</span>
              <span className="text-[11px] leading-tight text-center">{m.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
