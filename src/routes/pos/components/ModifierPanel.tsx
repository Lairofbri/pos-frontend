import { useState } from 'react'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Button } from '../../../components/ui/Button'
import type { Producto } from '../../../types'

interface ModifierPanelProps {
  open: boolean
  onClose: () => void
  producto: Producto | null
  onConfirm: (notas: string, modificadores: string[]) => void
}

const opciones = [
  { id: 'sin-queso', label: 'Sin queso' },
  { id: 'sin-cebolla', label: 'Sin cebolla' },
  { id: 'bien-cocido', label: 'Bien cocido' },
  { id: 'termino-medio', label: 'Término medio' },
  { id: 'extra-salsa', label: 'Extra salsa' },
  { id: 'sin-ajj', label: 'Sin Ajo' },
]

export function ModifierPanel({ open, onClose, producto, onConfirm }: ModifierPanelProps) {
  const [notas, setNotas] = useState('')
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  const toggle = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  if (!producto) return null

  return (
    <SidePanel open={open} onClose={onClose} title={producto.nombre}>
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 block">
            Modificadores
          </label>
          <div className="space-y-2">
            {opciones.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border-2 text-sm font-body transition-all duration-200 cursor-pointer ${
                  seleccionados.includes(opt.id)
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-secondary hover:border-accent/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">
            Notas
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Alguna instrucción especial..."
            rows={3}
            className="w-full bg-bg-surface border-2 border-border rounded-lg px-4 py-2.5 text-sm text-text-primary font-body placeholder:text-text-secondary/50 outline-none focus:border-accent resize-none"
          />
        </div>

        <Button
          className="w-full"
          onClick={() => {
            onConfirm(notas, seleccionados)
            setNotas('')
            setSeleccionados([])
          }}
        >
          Agregar
        </Button>
      </div>
    </SidePanel>
  )
}
