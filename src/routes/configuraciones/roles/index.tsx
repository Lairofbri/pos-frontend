import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarRoles, listarPermisos, obtenerPermisosRol, actualizarPermisosRol, resetPermisosRol } from './api'
import { Toggle } from '../../../components/ui/Toggle'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { Spinner } from '../../../components/ui/Spinner'
import { useToastStore } from '../../../store/toastStore'
import { useCatalogo } from '../../../hooks/useCatalogo'
import type { Permiso } from './api'

function PermisosEditor({ rol, onSave }: { rol: string; onSave: () => void }) {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [permisosLocales, setPermisosLocales] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const { data: catalogo } = useQuery({
    queryKey: ['permisos-catalogo'],
    queryFn: listarPermisos,
    ...queryDefaults('permisos-catalogo'),
  })

  const { data: permisosRol, isLoading } = useQuery({
    queryKey: ['permisos-rol', rol],
    queryFn: () => obtenerPermisosRol(rol),
    ...queryDefaults('permisos-rol'),
  })

  if (permisosRol && Object.keys(permisosLocales).length === 0) {
    setPermisosLocales(Object.fromEntries(permisosRol.map((p) => [p.codigo, p.activo])))
  }

  const guardarMutation = useMutation({
    mutationFn: () => actualizarPermisosRol(rol, { permisos: Object.entries(permisosLocales).map(([codigo, activo]) => ({ codigo, activo })) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permisos-rol', rol] }); setDirty(false); onSave(); showToast({ type: 'success', message: 'Permisos actualizados' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al guardar', description: err.message }),
  })

  const resetMutation = useMutation({
    mutationFn: () => resetPermisosRol(rol),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permisos-rol', rol] }); setConfirmReset(false); setDirty(false); showToast({ type: 'success', message: 'Permisos restablecidos' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al restablecer', description: err.message }),
  })

  const grupos = useMemo(() => {
    if (!catalogo) return []
    const map = new Map<string, Permiso[]>()
    for (const p of catalogo) {
      const grupo = p.grupo || 'General'
      if (!map.has(grupo)) map.set(grupo, [])
      map.get(grupo)!.push(p)
    }
    return Array.from(map.entries())
  }, [catalogo])

  const togglePermiso = (codigo: string) => {
    setPermisosLocales((prev) => ({ ...prev, [codigo]: !prev[codigo] }))
    setDirty(true)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      {grupos.map(([grupo, permisos]) => (
        <div key={grupo}>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">{grupo}</h3>
          <div className="bg-bg-surface rounded-xl border border-border divide-y divide-border/50">
            {permisos.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm text-text-primary font-body">{p.nombre}</span>
                  {p.descripcion && <p className="text-xs text-text-secondary mt-0.5">{p.descripcion}</p>}
                </div>
                <Toggle checked={permisosLocales[p.codigo] ?? false} onChange={() => togglePermiso(p.codigo)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <Button onClick={() => guardarMutation.mutate()} disabled={!dirty} loading={guardarMutation.isPending}>
          Guardar cambios {dirty && <Badge variant="warning">Sin guardar</Badge>}
        </Button>
        <Button variant="ghost" onClick={() => setConfirmReset(true)}>
          Restablecer defaults
        </Button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Restablecer permisos"
        message={`¿Restablecer los permisos a sus valores por defecto?`}
        onConfirm={() => resetMutation.mutate()}
        onCancel={() => setConfirmReset(false)}
        loading={resetMutation.isPending}
      />
    </div>
  )
}

export default function RolesPage() {
  const [rolActivo, setRolActivo] = useState('cajero')
  const { data: rolesCatalogo } = useCatalogo('roles')

  const rolLabels: Record<string, string> = useMemo(
    () => Object.fromEntries((rolesCatalogo ?? []).map((r) => [r.valor, r.label])),
    [rolesCatalogo]
  )

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: listarRoles,
    ...queryDefaults('roles'),
  })

  if (!roles) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {roles.map((rol) => (
          <button
            key={rol}
            onClick={() => setRolActivo(rol)}
            className={`px-4 py-2 rounded-lg border-2 text-sm font-body font-semibold transition-all cursor-pointer whitespace-nowrap ${
              rolActivo === rol
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
            }`}
          >
            {rolLabels[rol] || rol}
          </button>
        ))}
      </div>

      <PermisosEditor key={rolActivo} rol={rolActivo} onSave={() => {}} />
    </div>
  )
}
