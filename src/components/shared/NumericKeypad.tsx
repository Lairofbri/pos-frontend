interface NumericKeypadProps {
  onDigit: (d: string) => void
  onClear: () => void
  onBackspace: () => void
  onEnter?: () => void
}

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
]

export function NumericKeypad({ onDigit, onClear, onBackspace, onEnter }: NumericKeypadProps) {
  const handleKey = (k: string) => {
    if (k === '⌫') onBackspace()
    else if (k === '✓') onEnter?.()
    else onDigit(k)
  }

  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {keys.flat().map((k) => (
        <button
          key={k}
          onClick={() => handleKey(k)}
          className={`h-14 rounded-xl font-display text-xl border-2 transition-all duration-150 active:scale-95 cursor-pointer ${
            k === '✓'
              ? 'bg-pos-accent text-white border-pos-accent hover:brightness-110'
              : k === '⌫'
                ? 'bg-transparent text-text-secondary border-border hover:border-danger hover:text-danger'
                : 'bg-bg-surface text-text-primary border-border hover:border-pos-accent hover:text-pos-accent'
          }`}
        >
          {k}
        </button>
      ))}
      <button
        onClick={onClear}
        className="col-span-3 h-10 rounded-lg text-xs font-body text-text-secondary border border-border hover:text-danger hover:border-danger transition-colors cursor-pointer"
      >
        Limpiar
      </button>
    </div>
  )
}
