import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarUsuarios, crearUsuario, actualizarUsuario, resetearPin } from './api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { useToastStore } from '../../../store/toastStore'
import type { Usuario } from '../../../types'

const roles = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'mesero', label: 'Mesero' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'cocinero', label: 'Cocinero' },
]

const columns: Column<Usuario>[] = [
  {
    key: 'nombre',
    header: 'Nombre',
    sortable: true,
    render: (u) => <span>{u.nombre}{u.apellido ? ` ${u.apellido}` : ''}</span>,
  },
  { key: 'email', header: 'Email', render: (u) => <span className="text-text-secondary text-xs">{u.email ?? '—'}</span> },
  {
    key: 'rol',
    header: 'Rol',
    sortable: true,
    render: (u) => {
      const variant = u.rol === 'administrador' ? 'info' : u.rol === 'cajero' ? 'warning' : 'default'
      return <Badge variant={variant as 'info' | 'warning' | 'default'}>{u.rol}</Badge>
    },
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (u) => <Badge variant={u.activo ? 'success' : 'danger'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
]

export default function UsuariosPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [resetPinOpen, setResetPinOpen] = useState(false)
  const [nuevoPin, setNuevoPin] = useState('')
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', pin: '', rol: 'cajero' })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => listarUsuarios(),
    staleTime: 60_000,
  })

  const crearMutation = useMutation({
    mutationFn: () => crearUsuario({
      nombre: form.nombre,
      apellido: form.apellido || undefined,
      email: form.email || undefined,
      password: form.password || undefined,
       pin: form.pin,
      rol: form.rol,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); cerrarPanel(); showToast({ type: 'success', message: 'Usuario creado' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al crear', description: err.message }),
  })

  const editarMutation = useMutation({
    mutationFn: () => editando ? actualizarUsuario(editando.id, { nombre: form.nombre, apellido: form.apellido || undefined, email: form.email || undefined, rol: form.rol }) : Promise.reject(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); cerrarPanel(); showToast({ type: 'success', message: 'Usuario actualizado' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al actualizar', description: err.message }),
  })

  const resetPinMutation = useMutation({
    mutationFn: () => editando ? resetearPin(editando.id, nuevoPin) : Promise.reject(),
    onSuccess: () => { setResetPinOpen(false); setNuevoPin(''); showToast({ type: 'success', message: 'PIN reestablecido' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al reestablecer PIN', description: err.message }),
  })

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ nombre: '', apellido: '', email: '', password: '', pin: '', rol: 'cajero' })
    setPanelOpen(true)
  }

  const abrirEditar = (u: Usuario) => {
    setEditando(u)
    setForm({ nombre: u.nombre, apellido: u.apellido ?? '', email: u.email ?? '', password: '', pin: '', rol: u.rol })
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const guardar = () => { if (editando) editarMutation.mutate(); else crearMutation.mutate() }

  const esAdmin = form.rol === 'administrador'

  return (
    <>
      <div className="px-4 pb-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={abrirNuevo}>Nuevo Usuario</Button>
        </div>
        <DataTable
          data={data ?? []}
          columns={columns}
          onRowClick={abrirEditar}
          isLoading={isLoading}
          error={error as Error | null}
          onRetry={() => refetch()}
          keyExtractor={(u) => u.id}
        />
      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <div className="flex flex-col gap-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
          <Select
            label="Rol"
            options={roles}
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
          />

          {!editando && (
            <>
              {esAdmin && (
                <>
                  <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <Input label="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mín. 8 caracteres" />
                </>
              )}
              <Input label="PIN (6 dígitos)" type="password" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="••••••" />
            </>
          )}

          {editando && (
            <Button variant="secondary" onClick={() => { setResetPinOpen(true); setNuevoPin('') }}>
              Reestablecer PIN
            </Button>
          )}

          <Button className="w-full" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending} disabled={!form.nombre}>
            {editando ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </div>
      </SidePanel>

      <SidePanel open={resetPinOpen} onClose={() => setResetPinOpen(false)} title="Reestablecer PIN">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary font-body">Nuevo PIN para <strong className="text-text-primary">{editando?.nombre}</strong></p>
          <Input label="Nuevo PIN (6 dígitos)" type="password" maxLength={6} value={nuevoPin} onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" />
          <Button className="w-full" onClick={() => resetPinMutation.mutate()} loading={resetPinMutation.isPending} disabled={nuevoPin.length < 4}>
            Reestablecer
          </Button>
        </div>
      </SidePanel>
    </>
  )
}
