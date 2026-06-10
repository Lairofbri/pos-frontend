import { useState, useEffect, useRef } from 'react'

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounce?: number
}

export function SearchInput({
  value: externalValue = '',
  onChange,
  placeholder = 'Buscar...',
  debounce = 300,
}: SearchInputProps) {
  const [local, setLocal] = useState(externalValue)
  const initialMount = useRef(true)

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }
    const timer = setTimeout(() => {
      onChange(local)
    }, debounce)
    return () => clearTimeout(timer)
  }, [local, debounce, onChange])

  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
        🔍
      </span>
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-surface border-2 border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary font-body placeholder:text-text-secondary/50 outline-none transition-all duration-200 focus:border-accent"
      />
    </div>
  )
}
