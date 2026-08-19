import { Banknote, Equal } from 'lucide-react'

interface BillButtonsProps {
  onSelect: (amount: number) => void
  totalAPagar: number
}

const BILLS = [
  { amount: 1, label: '$1', bg: 'bg-emerald-500', border: 'border-emerald-600', ring: 'focus-visible:ring-emerald-400' },
  { amount: 5, label: '$5', bg: 'bg-sky-500', border: 'border-sky-600', ring: 'focus-visible:ring-sky-400' },
  { amount: 10, label: '$10', bg: 'bg-amber-500', border: 'border-amber-600', ring: 'focus-visible:ring-amber-400' },
  { amount: 20, label: '$20', bg: 'bg-violet-500', border: 'border-violet-600', ring: 'focus-visible:ring-violet-400' },
]

export function BillButtons({ onSelect, totalAPagar }: BillButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BILLS.map((bill) => (
        <button
          key={bill.amount}
          type="button"
          onClick={() => onSelect(bill.amount)}
          className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl border-2 text-white shadow-md active:scale-95 transition-transform duration-100 cursor-pointer touch-action-manipulation focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-surface hover:brightness-110 ${bill.bg} ${bill.border} ${bill.ring}`}
        >
          <Banknote className="size-5 text-white/70 drop-shadow" />
          <span className="text-base font-bold font-mono drop-shadow">{bill.label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onSelect(totalAPagar)}
        className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-pos-accent/10 border-2 border-pos-accent/20 text-pos-accent hover:bg-pos-accent/20 hover:border-pos-accent/40 active:scale-95 transition-transform duration-100 cursor-pointer touch-action-manipulation focus-visible:ring-2 focus-visible:ring-pos-accent/30 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-surface"
      >
        <Equal className="size-4" />
        <span className="text-sm font-semibold font-mono">Exacto ${totalAPagar.toFixed(2)}</span>
      </button>
    </div>
  )
}
