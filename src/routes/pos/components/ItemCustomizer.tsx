import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils'
import { queryDefaults } from '../../../config/queries'
import api from '../../../api/client'
import type { OrdenItem } from '../../../types'

interface IngredienteReceta {
  ingrediente_id: string
  ingrediente_nombre: string
  cantidad: number
  unidad_nombre: string
  unidad_abrev: string
}

interface ProductoExtra {
  id: string
  nombre: string
  precio: number
}

interface ModificacionesState {
  sin?: string[]
  extra?: Array<{ producto_id: string; cantidad: number; precio: number }>
  notas_extra?: string
}

interface ItemCustomizerProps {
  open: boolean
  onClose: () => void
  item: OrdenItem | null
  onSave: (modificaciones: ModificacionesState, notas: string) => void
}

export function ItemCustomizer({ open, onClose, item, onSave }: ItemCustomizerProps) {
  const [sin, setSin] = useState<Set<string>>(new Set())
  const [extras, setExtras] = useState<Set<string>>(new Set())
  const extrasPrecioRef = useRef<Map<string, number>>(new Map())
  const [notasExtra, setNotasExtra] = useState('')
  const [saving, setSaving] = useState(false)

  const productoId = item?.producto_id
  const categoriaExtrasId = item?.categoria_extras_id as string | undefined

  const { data: ingredientes = [] } = useQuery({
    queryKey: ['receta-ingredientes', productoId],
    queryFn: async (): Promise<IngredienteReceta[]> => {
      if (!productoId) return []
      const r = await api.get<{ ok: boolean; data: { ingredientes: IngredienteReceta[] } }>(`/recetas/producto/${productoId}`)
      return (r.data as unknown as { data: { ingredientes: IngredienteReceta[] } }).data.ingredientes || []
    },
    enabled: open && !!productoId,
    ...queryDefaults('receta-ingredientes'),
  })

  const { data: extrasList = [] } = useQuery({
    queryKey: ['productos-extras', categoriaExtrasId],
    queryFn: async (): Promise<ProductoExtra[]> => {
      if (!categoriaExtrasId) return []
      const r = await api.get<{ ok: boolean; data: { productos: Array<{ id: string; nombre: string; precio: string }> } }>('/productos', {
        params: { categoria_id: categoriaExtrasId, activo: true },
      })
      return ((r.data as unknown as { data: { productos: Array<{ id: string; nombre: string; precio: string }> } }).data.productos || []).map((p: { id: string; nombre: string; precio: string }) => ({
        id: p.id, nombre: p.nombre, precio: parseFloat(p.precio),
      }))
    },
    enabled: open && !!categoriaExtrasId,
    ...queryDefaults('productos-extras'),
  })

  useEffect(() => {
    if (!open) return
    if (item?.modificaciones) {
      const mod = item.modificaciones as ModificacionesState
      setSin(new Set(mod.sin || []))
      setExtras(new Set((mod.extra || []).map(e => e.producto_id)))
      const pmap = new Map<string, number>()
      for (const e of (mod.extra || [])) pmap.set(e.producto_id, e.precio)
      extrasPrecioRef.current = pmap
      setNotasExtra(mod.notas_extra || '')
    } else {
      setSin(new Set())
      setExtras(new Set())
      extrasPrecioRef.current = new Map()
      setNotasExtra('')
    }
  }, [open, item])

  useEffect(() => {
    if (!open || ingredientes.length === 0) return
    if (!item?.modificaciones) {
      setSin(new Set(ingredientes.map((i: IngredienteReceta) => i.ingrediente_id)))
    }
  }, [open, ingredientes, item])

  const toggleIngrediente = (id: string) => {
    setSin(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleExtra = (id: string, precio: number) => {
    setExtras(prev => {
      const next = new Set(prev)
      const pmap = new Map(extrasPrecioRef.current)
      if (next.has(id)) {
        next.delete(id)
        pmap.delete(id)
      } else {
        next.add(id)
        pmap.set(id, precio)
      }
      extrasPrecioRef.current = pmap
      return next
    })
  }

  const generarNotas = (): string => {
    const partes: string[] = []
    const sinNombres = ingredientes
      .filter(i => !sin.has(i.ingrediente_id))
      .map(i => `Sin ${i.ingrediente_nombre}`)
    if (sinNombres.length) partes.push(sinNombres.join(', '))
    const extraNombres = extrasList
      .filter(e => extras.has(e.id))
      .map(e => `+ ${e.nombre}`)
    if (extraNombres.length) partes.push(extraNombres.join(', '))
    if (notasExtra.trim()) partes.push(notasExtra.trim())
    return partes.join('. ')
  }

  const extrasTotal = extrasList
    .filter(e => extras.has(e.id))
    .reduce((sum, e) => sum + (e.precio || 0), 0)

  const handleSave = () => {
    setSaving(true)
    const mod: ModificacionesState = {}
    const sinIds = ingredientes.filter(i => !sin.has(i.ingrediente_id)).map(i => i.ingrediente_id)
    if (sinIds.length) mod.sin = sinIds
    const extraList = extrasList.filter(e => extras.has(e.id)).map(e => ({
      producto_id: e.id, cantidad: 1, precio: e.precio || 0,
    }))
    if (extraList.length) mod.extra = extraList
    if (notasExtra.trim()) mod.notas_extra = notasExtra.trim()
    onSave(mod, generarNotas())
    setSaving(false)
  }

  const sectionLabel = (text: string) => (
    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{text}</p>
  )

  if (!item) return null

  return (
    <SidePanel open={open} onClose={onClose} title={`Personalizar: ${item.nombre}`} direction="bottom">
      <div className="flex flex-col gap-5 p-4">
        {ingredientes.length > 0 && (
          <div>
            {sectionLabel('Ingredientes')}
            <div className="grid grid-cols-2 gap-2">
              {ingredientes.map((ing: IngredienteReceta) => (
                <label
                  key={ing.ingrediente_id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm transition-colors',
                    sin.has(ing.ingrediente_id) ? 'border-accent/40 bg-accent/5' : 'border-border bg-bg-surface opacity-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={sin.has(ing.ingrediente_id)}
                    onChange={() => toggleIngrediente(ing.ingrediente_id)}
                    className="size-4 accent-accent rounded"
                  />
                  <span className="truncate">{ing.ingrediente_nombre}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {extrasList.length > 0 && (
          <div>
            {sectionLabel('Extras (+$)')}
            <div className="grid grid-cols-2 gap-2">
              {extrasList.map((ext: ProductoExtra) => (
                <button
                  key={ext.id}
                  type="button"
                  onClick={() => toggleExtra(ext.id, ext.precio || 0)}
                  className={cn(
                    'text-left p-2 rounded-lg border text-sm transition-colors cursor-pointer',
                    extras.has(ext.id) ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-border bg-bg-surface text-text-primary hover:border-accent/40',
                  )}
                >
                  <span className="truncate block">{ext.nombre}</span>
                  {ext.precio > 0 && <span className="text-[10px] text-text-secondary">+${ext.precio.toFixed(2)}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          {sectionLabel('Notas para cocina')}
          <Textarea
            value={notasExtra}
            onChange={(e) => setNotasExtra(e.target.value)}
            placeholder="Ej: término medio, sin sal..."
            rows={2}
          />
          <p className="text-[10px] text-text-secondary mt-1">
            Cocina verá: "{generarNotas() || '(sin notas)'}"
          </p>
        </div>

        {extrasTotal > 0 && (
          <div className="flex justify-between items-center p-3 bg-accent/5 border border-accent/20 rounded-lg">
            <span className="text-sm font-semibold">Total de extras</span>
            <span className="text-sm font-bold text-accent">+${extrasTotal.toFixed(2)}</span>
          </div>
        )}

        <Button className="w-full" onClick={handleSave} loading={saving}>
          Guardar
        </Button>
      </div>
    </SidePanel>
  )
}
