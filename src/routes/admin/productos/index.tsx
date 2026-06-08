import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarProductos, crearProducto, actualizarProducto } from './api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import type { Producto } from '../../../types'

const columns: Column<Producto>[] = [
  { key: 'nombre', header: 'Nombre', sortable: true },
  {
    key: 'precio',
    header: 'Precio',
    sortable: true,
    render: (p) => <span className="font-mono">${p.precio.toFixed(2)}</span>,
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (p) => (
      <Badge variant={p.activo ? 'success' : 'danger'}>
        {p.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  { key: 'stock_actual', header: 'Stock', render: (p) => p.tiene_stock ? p.stock_actual : '—' },
]

export default function ProductosPage() {
  const queryClient = useQueryClient()
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: 0, categoria_id: '', tiene_stock: false, stock_actual: 0 })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['productos'],
    queryFn: () => listarProductos(),
  })

  const crearMutation = useMutation({
    mutationFn: () => crearProducto(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      cerrarPanel()
    },
  })

  const editarMutation = useMutation({
    mutationFn: () => editando ? actualizarProducto(editando.id, form) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      cerrarPanel()
    },
  })

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', precio: 0, categoria_id: '', tiene_stock: false, stock_actual: 0 })
    setPanelOpen(true)
  }

  const abrirEditar = (p: Producto) => {
    setEditando(p)
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoria_id: p.categoria_id || '', tiene_stock: p.tiene_stock, stock_actual: p.stock_actual })
    setPanelOpen(true)
  }

  const cerrarPanel = () => {
    setPanelOpen(false)
    setEditando(null)
  }

  const guardar = () => {
    if (editando) editarMutation.mutate()
    else crearMutation.mutate()
  }

  return (
    <>
      <div className="px-4 pb-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={abrirNuevo} icon="+">
            Nuevo Producto
          </Button>
        </div>

        <DataTable
          data={data ?? []}
          columns={columns}
          onRowClick={abrirEditar}
          isLoading={isLoading}
          error={error as Error | null}
          onRetry={() => refetch()}
          keyExtractor={(p) => p.id}
        />
      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title={editando ? 'Editar Producto' : 'Nuevo Producto'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <Input label="Precio" type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value || '0') })} />
          <Button className="w-full" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending}>
            {editando ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </SidePanel>
    </>
  )
}
