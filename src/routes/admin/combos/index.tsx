import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarCombos, crearCombo, actualizarCombo, eliminarCombo } from './api'
import { listarProductos } from '../productos/api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToastStore } from '../../../store/toastStore'
import type { Combo } from '../../../types'

const columns: Column<Combo>[] = [
  { key: 'nombre', header: 'Nombre', sortable: true },
  {
    key: 'precio',
    header: 'Precio',
    sortable: true,
    render: (c) => <span className="font-mono">${c.precio?.toFixed(2)}</span>,
  },
  {
    key: 'productos',
    header: 'Productos',
    render: (c) => <span className="text-xs text-text-secondary">{c.productos?.length ?? 0} items</span>,
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (c) => <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
]

interface ProductoSeleccionado {
  producto_id: string
  nombre: string
  cantidad: number
}

export default function CombosPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Combo | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Combo | null>(null)
  const [form, setForm] = useState({ nombre: '', precio: '' })
  const [productos, setProductos] = useState<ProductoSeleccionado[]>([])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['combos'],
    queryFn: () => listarCombos(true),
    ...queryDefaults('combos'),
  })

  const { data: productosDisponibles } = useQuery({
    queryKey: ['productos'],
    queryFn: () => listarProductos({}),
    ...queryDefaults('productos'),
  })

  const crearMutation = useMutation({
    mutationFn: () => {
      const productosPayload = productos.map((p) => ({ producto_id: p.producto_id, cantidad: p.cantidad }))
      return crearCombo({ nombre: form.nombre, precio: parseFloat(form.precio || '0'), productos: productosPayload })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['combos'] }); cerrarPanel(); showToast({ type: 'success', message: 'Combo creado' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al crear', description: err.message }),
  })

  const editarMutation = useMutation({
    mutationFn: () => {
      if (!editando) return Promise.reject()
      const productosPayload = productos.map((p) => ({ producto_id: p.producto_id, cantidad: p.cantidad }))
      return actualizarCombo(editando.id, { nombre: form.nombre, precio: parseFloat(form.precio || '0'), productos: productosPayload })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['combos'] }); cerrarPanel(); showToast({ type: 'success', message: 'Combo actualizado' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al actualizar', description: err.message }),
  })

  const eliminarMutation = useMutation({
    mutationFn: () => confirmDelete ? eliminarCombo(confirmDelete.id) : Promise.reject(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['combos'] }); setConfirmDelete(null); showToast({ type: 'success', message: 'Combo eliminado' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al eliminar', description: err.message }),
  })

  const abrirNuevo = () => { setEditando(null); setForm({ nombre: '', precio: '' }); setProductos([]); setPanelOpen(true) }

  const abrirEditar = (c: Combo) => {
    setEditando(c)
    setForm({ nombre: c.nombre, precio: c.precio.toString() })
    setProductos(c.productos.map((p) => ({ producto_id: p.producto_id, nombre: p.nombre ?? '', cantidad: p.cantidad })))
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const guardar = () => { if (editando) editarMutation.mutate(); else crearMutation.mutate() }

  const agregarProducto = (productoId: string) => {
    const prod = productosDisponibles?.find((p) => p.id === productoId)
    if (!prod) return
    setProductos((prev) => {
      const existe = prev.find((p) => p.producto_id === productoId)
      if (existe) return prev.map((p) => p.producto_id === productoId ? { ...p, cantidad: p.cantidad + 1 } : p)
      return [...prev, { producto_id: productoId, nombre: prod.nombre, cantidad: 1 }]
    })
  }

  const quitarProducto = (productoId: string) => {
    setProductos((prev) => prev.filter((p) => p.producto_id !== productoId))
  }

  const cambiarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) { quitarProducto(productoId); return }
    setProductos((prev) => prev.map((p) => p.producto_id === productoId ? { ...p, cantidad } : p))
  }

  const disponibles = productosDisponibles?.filter((p) => p.activo && !productos.some((sp) => sp.producto_id === p.id)) ?? []

  return (
    <>
      <div className="px-4 pb-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={abrirNuevo}>Nuevo Combo</Button>
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

      <SidePanel open={panelOpen} onClose={cerrarPanel} title={editando ? 'Editar Combo' : 'Nuevo Combo'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Precio" type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Productos del combo</label>
            {productos.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {productos.map((p) => (
                  <div key={p.producto_id} className="flex items-center gap-2 bg-bg-primary rounded-lg px-3 py-2 border border-border">
                    <span className="text-sm flex-1 truncate text-text-primary font-body">{p.nombre}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => cambiarCantidad(p.producto_id, p.cantidad - 1)} className="w-6 h-6 rounded bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer text-xs">−</button>
                      <span className="font-mono text-sm text-text-primary w-5 text-center">{p.cantidad}</span>
                      <button onClick={() => cambiarCantidad(p.producto_id, p.cantidad + 1)} className="w-6 h-6 rounded bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer text-xs">+</button>
                    </div>
                    <button onClick={() => quitarProducto(p.producto_id)} className="text-text-secondary hover:text-danger cursor-pointer text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}

            {disponibles.length > 0 && (
              <select
                value=""
                onChange={(e) => { if (e.target.value) { agregarProducto(e.target.value); e.target.value = '' } }}
                className="w-full bg-bg-surface border-2 border-border rounded-lg px-3 py-2 text-sm text-text-primary font-body outline-none focus:border-accent cursor-pointer"
              >
                <option value="" disabled>Agregar producto...</option>
                {disponibles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} — ${p.precio.toFixed(2)}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending} disabled={!form.nombre || !form.precio || productos.length === 0}>
              {editando ? 'Guardar cambios' : 'Crear combo'}
            </Button>
            {editando && <Button variant="danger" onClick={() => setConfirmDelete(editando)}>Eliminar</Button>}
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar combo"
        message={`¿Desactivar "${confirmDelete?.nombre}"?`}
        onConfirm={() => eliminarMutation.mutate()}
        onCancel={() => setConfirmDelete(null)}
        loading={eliminarMutation.isPending}
      />
    </>
  )
}
