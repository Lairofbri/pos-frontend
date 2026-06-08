import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-bg-surface border-2 border-border rounded-lg px-4 py-2.5 text-text-primary font-body text-sm outline-none transition-all duration-200 focus:border-accent focus:glow-amber cursor-pointer ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
