import { useState, useRef, useEffect } from 'react'
import { Icon } from './Icon'
import { iconOptions } from '../../constants/icons'

interface IconSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function IconSelect({ value, onChange, label }: IconSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = iconOptions.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabel = iconOptions.find((opt) => opt.value === value)?.label ?? 'Seleccionar icono...'

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch('') }}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 border-border bg-bg-surface text-sm text-text-primary font-body outline-none transition-all duration-200 hover:border-pos-accent/50 cursor-pointer text-left"
      >
        {value ? (
          <>
            <Icon name={value} className="w-5 h-5 shrink-0" />
            <span className="flex-1">{selectedLabel}</span>
          </>
        ) : (
          <span className="text-text-secondary/50 flex-1">Seleccionar icono...</span>
        )}
        <span className={`text-text-secondary text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-bg-surface border-2 border-border rounded-xl shadow-2xl max-h-64 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar icono..."
                className="w-full bg-bg-primary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary font-body outline-none focus:border-pos-accent"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-text-secondary">Sin resultados</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer hover:bg-bg-surface-hover ${
                    opt.value === value ? 'bg-pos-accent/10 text-pos-accent' : 'text-text-primary'
                  }`}
                >
                  <Icon name={opt.value} className="w-5 h-5 shrink-0" />
                  <span>{opt.label}</span>
                  {opt.value === value && <span className="ml-auto text-pos-accent text-xs">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
