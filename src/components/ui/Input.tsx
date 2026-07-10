import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-bg-surface border-2 border-border rounded-lg px-4 py-2.5 text-text-primary font-body text-sm placeholder:text-text-secondary/50 outline-none transition-all duration-200 focus:border-pos-accent focus:glow-pos ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-danger">{error}</span>
      )}
    </div>
  )
}
