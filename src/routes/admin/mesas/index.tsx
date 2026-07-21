import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { queryDefaults } from '../../../config/queries'
import { listarMesas, crearMesa, actualizarMesa } from './api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { LoadingOverlay } from '../../../components/shared/LoadingOverlay'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import type { Mesa } from '../../../types'

const columns: Column<Mesa>[] = [
  {
    key: 'numero',
    header: 'Mesa',
    sortable: true,
    render: (m) => <span className="font-display text-base">{m.numero}</span>,
  },
  {
    key: 'nombre',
    header: 'Nombre',
    render: (m) => <span className="text-text-secondary">{m.nombre ?? '—'}</span>,
  },
  { key: 'capacidad', header: 'Cap.', sortable: true, render: (m) => <span className="font-mono text-text-secondary">{m.capacidad}</span> },
  {
    key: 'estado',
    header: 'Estado',
    render: (m) => {
      if (m.estado === 'ocupada') return <Badge variant="warning">Ocupada</Badge>
      if (m.estado === 'reservada') return <Badge variant="info">Reservada</Badge>
      if (m.estado === 'inactiva') return <Badge variant="danger">Inactiva</Badge>
      return <Badge variant="success">Disponible</Badge>
    },
  },
  {
    key: 'activo',
    header: 'Activa',
    render: (m) => <Badge variant={m.activo ? 'success' : 'danger'}>{m.activo ? 'Sí' : 'No'}</Badge>,
  },
]

export default function MesasPage() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Mesa | null>(null)
  const [form, setForm] = useState({ numero: '', nombre: '', capacidad: '4' })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mesas-admin'],
    queryFn: () => listarMesas(true),
    ...queryDefaults('mesas-admin'),
  })

  const crearMutation = useApiMutation({
    mutationFn: () => crearMesa({ numero: form.numero, nombre: form.nombre || undefined, capacidad: parseInt(form.capacidad || '4') }),
    queryKey: ['mesas-admin', 'mesas'],
    successMessage: 'Mesa creada exitosamente',
    onSuccess: () => cerrarPanel(),
  })

  const editarMutation = useApiMutation({
    mutationFn: () => editando ? actualizarMesa(editando.id, { numero: form.numero, nombre: form.nombre || undefined, capacidad: parseInt(form.capacidad || '4') }) : Promise.reject(new Error('No editando')),
    queryKey: ['mesas-admin', 'mesas'],
    successMessage: 'Mesa actualizada exitosamente',
    onSuccess: () => cerrarPanel(),
  })

  const abrirNuevo = () => { setEditando(null); setForm({ numero: '', nombre: '', capacidad: '4' }); setPanelOpen(true) }

  const abrirEditar = (m: Mesa) => {
    setEditando(m)
    setForm({ numero: m.numero, nombre: m.nombre ?? '', capacidad: m.capacidad.toString() })
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const guardar = () => { if (editando) editarMutation.mutate(); else crearMutation.mutate() }
  const isMutating = crearMutation.isPending || editarMutation.isPending

  return (
    <>
      <div className="px-4 pb-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={abrirNuevo}>Nueva Mesa</Button>
        </div>
        <DataTable
          data={data ?? []}
          columns={columns}
          onRowClick={abrirEditar}
          isLoading={isLoading}
          error={error as Error | null}
          onRetry={() => refetch()}
          keyExtractor={(m) => m.id}
        />
      </div>

      <SidePanel open={panelOpen} onClose={() => { if (!isMutating) cerrarPanel() }} title={editando ? 'Editar Mesa' : 'Nueva Mesa'}>
        <div className="relative">
          {isMutating && <LoadingOverlay />}
          <div className="flex flex-col gap-4">
            <Input label="Número" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="1, B2, etc." required />
            <Input label="Nombre (opcional)" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Mesa 1, Barra 1" />
            <Input label="Capacidad" type="number" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: e.target.value })} min={1} />
            <Button className="w-full" onClick={guardar} loading={isMutating} disabled={!form.numero}>
              {editando ? 'Guardar cambios' : 'Crear mesa'}
            </Button>
          </div>
        </div>
      </SidePanel>
    </>
  )
}
