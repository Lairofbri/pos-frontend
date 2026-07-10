interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-pos-accent' : 'bg-border'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
      {label && (
        <span className="text-sm text-text-primary font-body">{label}</span>
      )}
    </label>
  )
}
