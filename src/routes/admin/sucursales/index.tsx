import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { queryDefaults } from '../../../config/queries'
import { listarSucursales, crearSucursal, actualizarSucursal } from './api'
import type { Sucursal } from './api'
import { SidePanel } from '../../../components/shared/SidePanel'
import { LoadingOverlay } from '../../../components/shared/LoadingOverlay'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { InlineError } from '../../../components/shared/InlineError'
import { Spinner } from '../../../components/ui/Spinner'

const FORM_INICIAL = { nombre: '', direccion: '', telefono: '' }

function SucursalCard({ s, activa, onEditar, onToggle }: { s: Sucursal; activa: boolean; onEditar: () => void; onToggle: () => void }) {
  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        activa
          ? 'border-accent bg-accent/5 shadow-sm'
          : 'border-border bg-bg-surface hover:border-accent/40 hover:shadow-sm'
      }`}
      onClick={onEditar}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{s.es_principal ? '⭐' : '🏪'}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{s.nombre}</p>
            {s.es_principal && <span className="text-[10px] font-semibold uppercase tracking-wider text-accent/70">Principal</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge variant={s.activo ? 'success' : 'danger'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-secondary font-body">
        {s.direccion && (
          <span className="truncate max-w-48">{s.direccion}</span>
        )}
        {s.telefono && (
          <>
            {s.direccion && <span className="w-px h-3 bg-border shrink-0" />}
            <span className="shrink-0">{s.telefono}</span>
          </>
        )}
      </div>

      <div className="mt-3 flex gap-2 border-t border-border/50 pt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            s.activo
              ? 'text-danger/70 hover:text-danger bg-danger/5 hover:bg-danger/10'
              : 'text-success/70 hover:text-success bg-success/5 hover:bg-success/10'
          }`}
        >
          {s.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  )
}

export default function SucursalesPage() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Sucursal | null>(null)
  const [form, setForm] = useState(FORM_INICIAL)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sucursales'],
    queryFn: () => listarSucursales(),
    ...queryDefaults('sucursales'),
  })

  const crearMutation = useApiMutation({
    mutationFn: () => crearSucursal({ nombre: form.nombre, direccion: form.direccion || undefined, telefono: form.telefono || undefined }),
    queryKey: ['sucursales'],
    successMessage: 'Sucursal creada exitosamente',
    onSuccess: () => cerrarPanel(),
  })

  const editarMutation = useApiMutation({
    mutationFn: () => editando ? actualizarSucursal(editando.id, { nombre: form.nombre, direccion: form.direccion || undefined, telefono: form.telefono || undefined }) : Promise.reject(new Error('No editando')),
    queryKey: ['sucursales'],
    successMessage: 'Sucursal actualizada exitosamente',
    onSuccess: () => cerrarPanel(),
  })

  const toggleActivoMutation = useApiMutation({
    mutationFn: (params: Sucursal) => actualizarSucursal(params.id, { activo: !params.activo }),
    queryKey: ['sucursales'],
    successMessage: 'Estado actualizado',
  })

  const abrirNuevo = () => {
    setEditando(null)
    setForm(FORM_INICIAL)
    setPanelOpen(true)
  }

  const abrirEditar = (s: Sucursal) => {
    setEditando(s)
    setForm({ nombre: s.nombre, direccion: s.direccion ?? '', telefono: s.telefono ?? '' })
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const guardar = () => { if (editando) editarMutation.mutate(); else crearMutation.mutate() }
  const isMutating = crearMutation.isPending || editarMutation.isPending

  return (
    <>
      <div className="px-4 pb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs text-text-secondary font-body">
            {data ? `${data.length} sucursal(es)` : ''}
          </p>
          <Button size="sm" onClick={abrirNuevo}>Nueva Sucursal</Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {error && !isLoading && (
          <InlineError message={(error as Error).message || 'Error al cargar sucursales'} onRetry={() => refetch()} />
        )}

        {data && data.length === 0 && !isLoading && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="text-4xl">🏪</span>
            <p className="text-sm text-text-secondary font-body">No hay sucursales registradas</p>
            <Button size="sm" onClick={abrirNuevo}>Crear primera sucursal</Button>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map((s) => (
              <SucursalCard
                key={s.id}
                s={s}
                activa={editando?.id === s.id}
                onEditar={() => abrirEditar(s)}
                onToggle={() => toggleActivoMutation.mutate(s)}
              />
            ))}
          </div>
        )}
      </div>

      <SidePanel open={panelOpen} onClose={() => { if (!isMutating) cerrarPanel() }} title={editando ? 'Editar Sucursal' : 'Nueva Sucursal'}>
        <div className="relative">
          {isMutating && <LoadingOverlay />}
          <div className="flex flex-col gap-4">
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            <Input label="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <Button className="w-full" onClick={guardar} loading={isMutating} disabled={!form.nombre}>
              {editando ? 'Guardar cambios' : 'Crear sucursal'}
            </Button>
          </div>
        </div>
      </SidePanel>
    </>
  )
}
