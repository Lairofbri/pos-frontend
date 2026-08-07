import { useState, useEffect } from 'react'
import { SidePanel } from './SidePanel'
import { ConfirmDialog } from './ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { IconSelect } from './IconSelect'
import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from '../../api/categorias'
import { useToastStore } from '../../store/toastStore'
import type { Categoria } from '../../types'
import { MAX_NIVEL_CATEGORIAS } from '../../config/constants'

function flattenAllCategories(items: Categoria[]): Categoria[] {
  const result: Categoria[] = []
  for (const item of items) {
    result.push(item)
    if (item.hijos?.length) {
      result.push(...flattenAllCategories(item.hijos))
    }
  }
  return result
}

function buildChain(items: Categoria[], targetId: string | null): Categoria[] {
  if (!targetId) return []
  for (const c of items) {
    if (c.id === targetId) return [c]
    if (c.hijos?.length) {
      const found = buildChain(c.hijos, targetId)
      if (found.length) return [c, ...found]
    }
  }
  return []
}

interface CategoryPanelProps {
  open: boolean
  onClose: () => void
  module?: string
  variant?: 'sidepanel' | 'modal'
  editing?: Categoria | null
}

export function CategoryPanel({ open, onClose, module, variant = 'sidepanel', editing }: CategoryPanelProps) {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)

  const [editando, setEditando] = useState<Categoria | null>(null)
  const [form, setForm] = useState({ nombre: '', icono: '' })
  const [nivel1, setNivel1] = useState('')
  const [nivel2, setNivel2] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null)

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-arbol', module],
    queryFn: () => listarCategorias({ arbol: true, modulo: module }),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      if (editing) {
        setEditando(editing)
        setForm({ nombre: editing.nombre, icono: editing.icono ?? '' })
        const chain = categoriasData ? buildChain(categoriasData, editing.parent_id) : []
        setNivel1(chain[0]?.id ?? '')
        setNivel2(chain[1]?.id ?? '')
      } else {
        setEditando(null)
        setForm({ nombre: '', icono: '' })
        setNivel1('')
        setNivel2('')
        setConfirmDelete(null)
      }
    }
  }, [open, editing])

  const allCategoriesPlanas = categoriasData ? flattenAllCategories(categoriasData) : []

  const catOptionsNivel1 = allCategoriesPlanas.filter(c => !c.parent_id && c.activo).map(c => ({ value: c.id, label: c.nombre }))
  const catOptionsNivel2 = allCategoriesPlanas
    .filter(c => c.parent_id === nivel1 && c.activo)
    .map(c => ({ value: c.id, label: c.nombre }))

  const catParentId = nivel2 || nivel1 || undefined

  const crearMutation = useMutation({
    mutationFn: () => crearCategoria({
      nombre: form.nombre,
      parent_id: catParentId,
      icono: form.icono || undefined,
      modulo: module,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] })
      showToast({ type: 'success', message: 'Categoría creada' })
      onClose()
    },
  })

  const editarMutation = useMutation({
    mutationFn: () => editando
      ? actualizarCategoria(editando.id, {
          nombre: form.nombre,
          parent_id: catParentId,
          icono: form.icono || undefined,
          modulo: module,
        })
      : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] })
      showToast({ type: 'success', message: 'Categoría actualizada' })
      onClose()
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: () => confirmDelete ? eliminarCategoria(confirmDelete.id) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      queryClient.invalidateQueries({ queryKey: ['categorias-arbol'] })
      setConfirmDelete(null)
      showToast({ type: 'success', message: 'Categoría eliminada' })
      onClose()
    },
  })

  const getLevel = (id: string, lvl = 0): number => {
    const c = allCategoriesPlanas.find(x => x.id === id)
    if (!c?.parent_id) return lvl
    return getLevel(c.parent_id, lvl + 1)
  }

  const guardar = () => {
    if (catParentId) {
      const parentLevel = getLevel(catParentId) + 1
      if (parentLevel > MAX_NIVEL_CATEGORIAS) {
        showToast({ type: 'error', message: `Máximo ${MAX_NIVEL_CATEGORIAS + 1} niveles de categorías.` })
        return
      }
    }
    if (editando) editarMutation.mutate()
    else crearMutation.mutate()
  }

  const cerrarInterno = () => {
    onClose()
    setTimeout(() => {
      setEditando(null)
      setForm({ nombre: '', icono: '' })
      setNivel1('')
      setNivel2('')
      setConfirmDelete(null)
    }, 200)
  }

  const formContent = (
    <div className="flex flex-col gap-4">
      <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required autoFocus />
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Categoría padre</label>
        <Select
          label="Nivel 1"
          options={catOptionsNivel1}
          value={nivel1}
          onValueChange={(v) => { setNivel1(v); setNivel2('') }}
          placeholder="— Raíz —"
        />
        {nivel1 && (
          <Select
            label="Nivel 2"
            options={catOptionsNivel2}
            value={nivel2}
            onValueChange={(v) => setNivel2(v)}
            placeholder="— Ninguna —"
          />
        )}
      </div>
      <IconSelect label="Icono" value={form.icono} onChange={(v) => setForm({ ...form, icono: v })} />
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending}>
          {editando ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
        {editando && (
          <Button variant="danger" onClick={() => setConfirmDelete(editando)}>
            Eliminar
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {variant === 'modal' && open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={cerrarInterno} />
          <div className="relative bg-white rounded-xl shadow-xl overflow-hidden w-[95vw] sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-fadeInUp">
            <div className="h-9 bg-gradient-to-r from-accent-dark to-accent flex items-center px-4 shrink-0">
              <span className="text-white text-sm font-semibold">{editando ? 'Editar Categoría' : 'Nueva Categoría'}</span>
            </div>
            <div className="p-5">{formContent}</div>
          </div>
        </div>
      )}

      {variant === 'sidepanel' && (
        <SidePanel open={open} onClose={cerrarInterno} title={editando ? 'Editar Categoría' : 'Nueva Categoría'}>
          {formContent}
        </SidePanel>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar categoría"
        message={`¿Desactivar "${confirmDelete?.nombre}"? Los elementos asociados pasarán a sin categoría.`}
        confirmLabel="Desactivar"
        onConfirm={() => eliminarMutation.mutate()}
        onCancel={() => setConfirmDelete(null)}
        loading={eliminarMutation.isPending}
      />
    </>
  )
}
