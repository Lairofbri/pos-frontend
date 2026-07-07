import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarClientes, crearCliente, actualizarCliente, eliminarCliente } from './api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToastStore } from '../../../store/toastStore'
import { useCatalogo } from '../../../hooks/useCatalogo'
import type { Cliente } from '../../../types'

const columns: Column<Cliente>[] = [
  {
    key: 'nombre',
    header: 'Nombre',
    sortable: true,
    render: (c) => <span>{c.nombre}{c.apellido ? ` ${c.apellido}` : ''}</span>,
  },
  { key: 'telefono', header: 'Teléfono', render: (c) => <span className="text-text-secondary text-xs font-mono">{c.telefono ?? '—'}</span> },
  { key: 'email', header: 'Email', render: (c) => <span className="text-text-secondary text-xs">{c.email ?? '—'}</span> },
  {
    key: 'tipo_documento',
    header: 'Doc.',
    render: (c) => c.tipo_documento
      ? <Badge variant="default">{c.tipo_documento.toUpperCase()}</Badge>
      : <span className="text-text-secondary">—</span>,
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (c) => <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
]

export default function ClientesPage() {
  const queryClient = useQueryClient()
  const { data: tiposDocumento } = useCatalogo('tipos_documento')
  const showToast = useToastStore((s) => s.show)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Cliente | null>(null)
  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', email: '',
    tipo_documento: '', numero_documento: '', nit: '', nrc: '',
    razon_social: '', direccion: '', municipio: '', departamento: '',
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => listarClientes(),
    ...queryDefaults('clientes'),
  })

  const crearMutation = useMutation({
    mutationFn: () => crearCliente(cleanForm()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); cerrarPanel(); showToast({ type: 'success', message: 'Cliente creado' }) },
  })

  const editarMutation = useMutation({
    mutationFn: () => editando ? actualizarCliente(editando.id, cleanForm()) : Promise.reject(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); cerrarPanel(); showToast({ type: 'success', message: 'Cliente actualizado' }) },
  })

  const eliminarMutation = useMutation({
    mutationFn: () => confirmDelete ? eliminarCliente(confirmDelete.id) : Promise.reject(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); setConfirmDelete(null); showToast({ type: 'success', message: 'Cliente eliminado' }) },
  })

  const cleanForm = () => ({
    nombre: form.nombre,
    apellido: form.apellido || undefined,
    telefono: form.telefono || undefined,
    email: form.email || undefined,
    tipo_documento: (form.tipo_documento || undefined) as Cliente['tipo_documento'],
    numero_documento: form.numero_documento || undefined,
    nit: form.nit || undefined,
    nrc: form.nrc || undefined,
    razon_social: form.razon_social || undefined,
    direccion: form.direccion || undefined,
    municipio: form.municipio || undefined,
    departamento: form.departamento || undefined,
  })

  const abrirNuevo = () => { setEditando(null); resetForm(); setPanelOpen(true) }

  const abrirEditar = (c: Cliente) => {
    setEditando(c)
    setForm({
      nombre: c.nombre, apellido: c.apellido ?? '', telefono: c.telefono ?? '', email: c.email ?? '',
      tipo_documento: c.tipo_documento ?? '', numero_documento: c.numero_documento ?? '',
      nit: c.nit ?? '', nrc: c.nrc ?? '', razon_social: c.razon_social ?? '',
      direccion: c.direccion ?? '', municipio: c.municipio ?? '', departamento: c.departamento ?? '',
    })
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const resetForm = () => setForm({
    nombre: '', apellido: '', telefono: '', email: '',
    tipo_documento: '', numero_documento: '', nit: '', nrc: '',
    razon_social: '', direccion: '', municipio: '', departamento: '',
  })

  const guardar = () => { if (editando) editarMutation.mutate(); else crearMutation.mutate() }

  return (
    <>
      <div className="px-4 pb-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={abrirNuevo}>Nuevo Cliente</Button>
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

      <SidePanel open={panelOpen} onClose={cerrarPanel} title={editando ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            <Input label="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <hr className="border-border" />
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Documentación fiscal</p>

          <Select label="Tipo documento" options={(tiposDocumento ?? []).map((t) => ({ value: t.valor, label: t.label }))} value={form.tipo_documento} onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })} placeholder="Seleccionar..." />
          <Input label="Número documento" value={form.numero_documento} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="NIT" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
            <Input label="NRC" value={form.nrc} onChange={(e) => setForm({ ...form, nrc: e.target.value })} />
          </div>
          <Input label="Razón social" value={form.razon_social} onChange={(e) => setForm({ ...form, razon_social: e.target.value })} />
          <Input label="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Municipio" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
            <Input label="Departamento" value={form.departamento} onChange={(e) => setForm({ ...form, departamento: e.target.value })} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending} disabled={!form.nombre}>
              {editando ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
            {editando && <Button variant="danger" onClick={() => setConfirmDelete(editando)}>Eliminar</Button>}
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar cliente"
        message={`¿Desactivar a "${confirmDelete?.nombre}"?`}
        onConfirm={() => eliminarMutation.mutate()}
        onCancel={() => setConfirmDelete(null)}
        loading={eliminarMutation.isPending}
      />
    </>
  )
}
