import { useState } from 'react'
import { Printer } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarImpresoras, crearImpresora, actualizarImpresora, eliminarImpresora, probarImpresora } from './api'
import type { Impresora } from './api'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useToastStore } from '../../../store/toastStore'
import { PageHeader } from '../../../components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '../../../components/shared/EmptyState'
import { ErrorState } from '../../../components/shared/ErrorState'

const TIPOS = [
  { value: 'ticket-consumo', label: 'Ticket de Consumo' },
  { value: 'pre-cuenta', label: 'Pre-Cuenta' },
  { value: 'cocina', label: 'Cocina' },
] as const

type TipoImpresora = (typeof TIPOS)[number]['value']

const labelsTipo: Record<string, string> = {
  'ticket-consumo': 'Ticket Consumo',
  'pre-cuenta': 'Pre-Cuenta',
  cocina: 'Cocina',
}

export default function ImpresorasPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Impresora | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Impresora | null>(null)
  const [form, setForm] = useState({
    nombre: '', tipo: 'ticket-consumo' as TipoImpresora, ip: '', puerto: 9100, papel_mm: 80, caracteres_x_linea: 42,
  })

  const { data: impresoras, isLoading, error, refetch } = useQuery({
    queryKey: ['impresoras'],
    queryFn: listarImpresoras,
    ...queryDefaults('impresoras'),
  })

  const abrirForm = (imp?: Impresora) => {
    if (imp) {
      setForm({
        nombre: imp.nombre,
        tipo: imp.tipo as TipoImpresora,
        ip: imp.ip,
        puerto: imp.puerto,
        papel_mm: imp.papel_mm,
        caracteres_x_linea: imp.caracteres_x_linea,
      })
      setEditando(imp)
    } else {
      setForm({ nombre: '', tipo: 'ticket-consumo', ip: '', puerto: 9100, papel_mm: 80, caracteres_x_linea: 42 })
      setEditando(null)
    }
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const guardarMutation = useMutation({
    mutationFn: () => editando
      ? actualizarImpresora(editando.id, form)
      : crearImpresora(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impresoras'] })
      cerrarPanel()
      showToast({ type: 'success', message: editando ? 'Impresora actualizada' : 'Impresora creada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al guardar impresora' }),
  })

  const eliminarMutation = useMutation({
    mutationFn: () => eliminarImpresora(confirmDelete!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impresoras'] })
      setConfirmDelete(null)
      showToast({ type: 'success', message: 'Impresora eliminada' })
    },
    onError: () => showToast({ type: 'error', message: 'Error al eliminar impresora' }),
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => probarImpresora(id),
    onSuccess: (res) => showToast({ type: 'success', message: res.mensaje }),
    onError: () => showToast({ type: 'error', message: 'Error de conexión con la impresora' }),
  })

  return (
    <>
      <PageHeader title="Impresoras Térmicas" onNew={() => abrirForm()} newLabel="Nueva impresora" />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorState message="Error al cargar impresoras" onRetry={() => refetch()} />
      ) : !impresoras || impresoras.length === 0 ? (
        <EmptyState message="No hay impresoras configuradas. Crea una para empezar." icon={<Printer className="size-10 text-text-secondary" />} />
      ) : (
        <div className="flex flex-col gap-2">
          {impresoras.map((imp) => (
            <div
              key={imp.id}
              onClick={() => abrirForm(imp)}
              className="bg-bg-surface border border-border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-text-primary">{imp.nombre}</span>
                  <span className="text-xs text-text-secondary">IP: {imp.ip}:{imp.puerto}</span>
                </div>
                <Badge variant="default">{labelsTipo[imp.tipo] ?? imp.tipo}</Badge>
                <Badge variant={imp.activo ? 'success' : 'danger'}>{imp.activo ? 'Activa' : 'Inactiva'}</Badge>
                <span className="text-[11px] text-text-secondary/60">{imp.papel_mm}mm</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); testMutation.mutate(imp.id) }}
                  disabled={testMutation.isPending}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {testMutation.isPending ? '...' : 'Probar'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(imp) }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SidePanel
        open={panelOpen}
        onClose={cerrarPanel}
        title={editando ? 'Editar impresora' : 'Nueva impresora'}
      >
        <form onSubmit={(e) => { e.preventDefault(); guardarMutation.mutate() }} className="flex flex-col gap-4 p-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Caja Principal" required />

          <Select
            label="Tipo"
            value={form.tipo}
            onValueChange={(v) => setForm({ ...form, tipo: v as TipoImpresora })}
            options={TIPOS.map((t) => ({ value: t.value, label: t.label }))}
          />

          <Input label="Dirección IP" value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="192.168.1.100" required />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Puerto" type="number" value={String(form.puerto)} onChange={(e) => setForm({ ...form, puerto: Number(e.target.value) })} />
            <Input label="Papel (mm)" type="number" value={String(form.papel_mm)} onChange={(e) => setForm({ ...form, papel_mm: Number(e.target.value) })} />
            <Input label="Chars/línea" type="number" value={String(form.caracteres_x_linea)} onChange={(e) => setForm({ ...form, caracteres_x_linea: Number(e.target.value) })} />
          </div>

          {guardarMutation.isError && (
            <p className="text-xs text-danger text-center">Error al guardar</p>
          )}

          <Button type="submit" loading={guardarMutation.isPending} className="w-full">
            {editando ? 'Actualizar' : 'Crear'}
          </Button>
        </form>
      </SidePanel>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar impresora"
        message={`¿Eliminar "${confirmDelete?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={() => eliminarMutation.mutate()}
        onCancel={() => setConfirmDelete(null)}
        loading={eliminarMutation.isPending}
      />
    </>
  )
}
