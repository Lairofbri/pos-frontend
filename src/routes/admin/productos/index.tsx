import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarProductos, crearProducto, actualizarProducto } from './api'
import { listarCategorias } from '../categorias/api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Toggle } from '../../../components/ui/Toggle'
import { useToastStore } from '../../../store/toastStore'
import type { Producto } from '../../../types'

const columns: Column<Producto>[] = [
  { key: 'nombre', header: 'Nombre', sortable: true },
  {
    key: 'precio',
    header: 'Precio',
    sortable: true,
    render: (p) => (
      <span className="font-mono">${p.precio?.toFixed(2) ?? '0.00'}</span>
    ),
  },
  {
    key: 'categoria_nombre',
    header: 'Categoría',
    render: (p) => p.categoria_nombre
      ? <span className="text-text-secondary text-xs">{p.categoria_nombre}</span>
      : <span className="text-text-secondary/50 text-xs">—</span>,
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
]

export default function ProductosPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria_id: '',
    codigo: '',
    imagen_url: '',
    orden: 0,
    activo: true,
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['productos'],
    queryFn: () => listarProductos(),
    ...queryDefaults('productos'),
  })

  const { data: categorias } = useQuery({
    queryKey: ['categorias-select'],
    queryFn: () => listarCategorias(true),
    ...queryDefaults('categorias-select'),
  })

  const categoriasOptions = (categorias ?? [])
    .filter((c) => c.activo)
    .map((c) => ({ value: c.id, label: c.nombre }))

  const crearMutation = useMutation({
    mutationFn: () => crearProducto({
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      precio: form.precio,
      categoria_id: form.categoria_id || undefined,
      codigo: form.codigo || undefined,
      imagen_url: form.imagen_url || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      cerrarPanel()
      showToast({ type: 'success', message: 'Producto creado' })
    },
    onError: (err: Error) => {
      showToast({ type: 'error', message: 'Error al crear', description: err.message })
    },
  })

  const editarMutation = useMutation({
    mutationFn: () =>
      editando
        ? actualizarProducto(editando.id, {
            nombre: form.nombre,
            descripcion: form.descripcion || undefined,
            precio: form.precio,
            categoria_id: form.categoria_id || undefined,
            codigo: form.codigo || undefined,
            imagen_url: form.imagen_url || undefined,
            activo: form.activo,
          })
        : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      cerrarPanel()
      showToast({ type: 'success', message: 'Producto actualizado' })
    },
    onError: (err: Error) => {
      showToast({ type: 'error', message: 'Error al actualizar', description: err.message })
    },
  })

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', precio: 0, categoria_id: '', codigo: '', imagen_url: '', orden: 0, activo: true })
    setPanelOpen(true)
  }

  const abrirEditar = (p: Producto) => {
    setEditando(p)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      categoria_id: p.categoria_id ?? '',
      codigo: p.codigo ?? '',
      imagen_url: p.imagen_url ?? '',
      orden: p.orden ?? 0,
      activo: p.activo,
    })
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
          <Button size="sm" onClick={abrirNuevo}>
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

      <SidePanel
        open={panelOpen}
        onClose={cerrarPanel}
        title={editando ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <Input
            label="Precio"
            type="number"
            step="0.01"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value || '0') })}
          />

          <Select
            label="Categoría"
            options={categoriasOptions}
            value={form.categoria_id}
            onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            placeholder="Sin categoría"
          />

          <Input
            label="Código de barras"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            placeholder="Opcional"
          />

          <Input
            label="URL de imagen"
            value={form.imagen_url}
            onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
            placeholder="https://..."
          />

          {editando && (
            <Toggle
              checked={form.activo}
              onChange={(v) => setForm({ ...form, activo: v })}
              label="Producto activo"
            />
          )}

          <Button
            className="w-full"
            onClick={guardar}
            loading={crearMutation.isPending || editarMutation.isPending}
          >
            {editando ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </SidePanel>
    </>
  )
}
