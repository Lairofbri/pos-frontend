import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from './api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToastStore } from '../../../store/toastStore'
import type { Categoria } from '../../../types'

const columns: Column<Categoria>[] = [
  { key: 'nombre', header: 'Nombre', sortable: true },
  {
    key: 'color',
    header: 'Color',
    render: (c) => c.color ? (
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c.color }} />
        <span className="text-xs font-mono text-text-secondary">{c.color}</span>
      </div>
    ) : <span className="text-text-secondary">—</span>,
  },
  {
    key: 'orden',
    header: 'Orden',
    sortable: true,
    render: (c) => <span className="font-mono text-text-secondary">{c.orden ?? '—'}</span>,
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (c) => <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
]

export default function CategoriasPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '' })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => listarCategorias(true),
    ...queryDefaults('categorias'),
  })

  const crearMutation = useMutation({
    mutationFn: () => crearCategoria({ ...form, color: form.color || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categorias'] }); cerrarPanel(); showToast({ type: 'success', message: 'Categoría creada' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al crear', description: err.message }),
  })

  const editarMutation = useMutation({
    mutationFn: () => editando ? actualizarCategoria(editando.id, { ...form, color: form.color || undefined }) : Promise.reject(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categorias'] }); cerrarPanel(); showToast({ type: 'success', message: 'Categoría actualizada' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al actualizar', description: err.message }),
  })

  const eliminarMutation = useMutation({
    mutationFn: () => confirmDelete ? eliminarCategoria(confirmDelete.id) : Promise.reject(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categorias'] }); setConfirmDelete(null); showToast({ type: 'success', message: 'Categoría eliminada' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al eliminar', description: err.message }),
  })

  const abrirNuevo = () => { setEditando(null); setForm({ nombre: '', descripcion: '', color: '' }); setPanelOpen(true) }

  const abrirEditar = (c: Categoria) => {
    setEditando(c)
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? '', color: c.color ?? '' })
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const guardar = () => { if (editando) editarMutation.mutate(); else crearMutation.mutate() }

  return (
    <>
      <div className="px-4 pb-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={abrirNuevo}>Nueva Categoría</Button>
        </div>
        <DataTable
          data={data ?? []}
          columns={columns}
          onRowClick={abrirEditar}
          isLoading={isLoading}
          error={error as Error | null}
          onRetry={() => refetch()}
          keyExtractor={(c) => c.id}
        />
      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title={editando ? 'Editar Categoría' : 'Nueva Categoría'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <Input label="Color (hex)" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#D4A24C" />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending}>
              {editando ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
            {editando && (
              <Button variant="danger" onClick={() => setConfirmDelete(editando)}>Eliminar</Button>
            )}
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar categoría"
        message={`¿Desactivar "${confirmDelete?.nombre}"? Los productos asociados pasarán a sin categoría.`}
        confirmLabel="Desactivar"
        onConfirm={() => eliminarMutation.mutate()}
        onCancel={() => setConfirmDelete(null)}
        loading={eliminarMutation.isPending}
      />
    </>
  )
}
