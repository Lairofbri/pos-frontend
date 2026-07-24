import { useState } from 'react'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import type { Producto } from '../../../types'

interface ModifierPanelProps {
  open: boolean
  onClose: () => void
  producto: Producto | null
  onConfirm: (notas: string) => void
}

export function ModifierPanel({ open, onClose, producto, onConfirm }: ModifierPanelProps) {
  const [notas, setNotas] = useState('')

  if (!producto) return null

  return (
    <SidePanel open={open} onClose={onClose} title={producto.nombre}>
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">
            Notas / Instrucciones
          </label>
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Alguna instrucción especial para la cocina..."
            rows={4}
          />
        </div>

        <Button
          className="w-full"
          onClick={() => {
            onConfirm(notas)
            setNotas('')
          }}
        >
          Agregar con notas
        </Button>
      </div>
    </SidePanel>
  )
}
