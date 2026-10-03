import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, KeyRound, FileSignature } from 'lucide-react'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { queryDefaults } from '../../../config/queries'
import { getEstadoFiscal, crearEmpresa } from './api'
import { useAuthStore } from '../../../store/authStore'
import { PageHeader } from '../../../components/shared/PageHeader'
import { InlineError } from '../../../components/shared/InlineError'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'

const PROVISIONING_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  provisioning: { label: 'Provisión en curso', variant: 'info' },
  pending_fiscal_setup: { label: 'Configuración fiscal pendiente', variant: 'warning' },
  active: { label: 'Activa', variant: 'success' },
  blocked: { label: 'Bloqueada', variant: 'danger' },
  failed: { label: 'Falló la provisión', variant: 'danger' },
}

const FISCAL_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  pending_link: { label: 'Sin vínculo', variant: 'info' },
  pending_mh_data: { label: 'Datos MH pendientes', variant: 'warning' },
  ready: { label: 'Listo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'default' },
  blocked: { label: 'Bloqueado', variant: 'danger' },
}

const FORMA_INICIAL = { nombre: '', nit: '', nrc: '', email: '' }

export default function EmpresasPage() {
  const rol = useAuthStore(s => s.usuario?.rol)
  const esPlataforma = rol === 'plataforma'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(FORMA_INICIAL)

  const { data: estado, isLoading, error, refetch } = useQuery({
    queryKey: ['estado-fiscal'],
    queryFn: getEstadoFiscal,
    ...queryDefaults('estado-fiscal'),
  })

  const crearMutation = useApiMutation({
    mutationFn: () =>
      crearEmpresa({
        tenant_id: crypto.randomUUID(),
        operation_id: crypto.randomUUID(),
        nombre: form.nombre.trim(),
        nit: form.nit.trim(),
        nrc: form.nrc.trim() || null,
        email: form.email.trim() || null,
      }),
    queryKey: ['estado-fiscal'],
    successMessage: 'Empresa creada. La integración fiscal quedó configurada.',
    onSuccess: () => {
      setDialogOpen(false)
      setForm(FORMA_INICIAL)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.nit.trim()) return
    crearMutation.mutate()
  }

  const provisioning = estado ? PROVISIONING_STATUS[estado.provisioning_status] : undefined
  const firma = estado?.firma
  const firmaEstado = firma?.estado === 'listo' ? 'Lista' : firma?.estado === 'firmador_offline' ? 'Firmador fuera de línea' : firma?.estado === 'sin_credencial' ? 'Sin credencial' : (firma?.estado ?? '—')

  return (
    <div className="px-4 pb-4">
      <PageHeader title="Empresas" subtitle="Onboarding y estado fiscal de la integración POS ↔ DTE" />

      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-text-secondary font-body">
          La empresa y las credenciales fiscales se administran en el DTE Service (fuente de verdad fiscal).
        </p>
        {esPlataforma && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>Nueva empresa</Button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && !isLoading && (
        <InlineError message={(error as Error).message || 'Error al consultar el estado fiscal'} onRetry={() => refetch()} />
      )}

      {estado && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="dashboard-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="size-4 text-pos-accent" />
              <h2 className="font-semibold text-sm text-text-primary">Empresa</h2>
            </div>
            <div className="flex flex-col gap-3 text-sm font-body">
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-secondary text-xs">Estado de provisión</span>
                {provisioning && <Badge variant={provisioning.variant}>{provisioning.label}</Badge>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-secondary text-xs">Credenciales Hacienda</span>
                <Badge variant={estado.credenciales_hacienda ? 'success' : 'warning'}>
                  {estado.credenciales_hacienda ? 'Configuradas' : 'Pendientes'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-secondary text-xs">Token Hacienda vigente</span>
                <Badge variant={estado.token_vigente ? 'success' : 'info'}>
                  {estado.token_vigente ? 'Vigente' : 'No vigente'}
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary mt-2">
                Las credenciales de Hacienda solo se administran desde el DTE Service. El POS nunca las recibe.
              </p>
            </div>
          </section>

          <section className="dashboard-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileSignature className="size-4 text-pos-accent" />
              <h2 className="font-semibold text-sm text-text-primary">Firma</h2>
            </div>
            <div className="flex flex-col gap-3 text-sm font-body">
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-secondary text-xs">Certificado de firma</span>
                <Badge variant={firma?.estado === 'listo' ? 'success' : 'warning'}>{firmaEstado}</Badge>
              </div>
              {firma?.nit && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-secondary text-xs">NIT</span>
                  <span className="font-mono text-xs">{firma.nit}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-secondary text-xs">Firmador disponible</span>
                <Badge variant={firma?.firmador_disponible ? 'success' : 'danger'}>
                  {firma?.firmador_disponible ? 'Disponible' : 'No disponible'}
                </Badge>
              </div>
            </div>
          </section>

          <section className="dashboard-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="size-4 text-pos-accent" />
              <h2 className="font-semibold text-sm text-text-primary">Establecimientos</h2>
            </div>
            {estado.establecimientos.length === 0 ? (
              <p className="text-xs text-text-secondary font-body">No hay establecimientos vinculados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {estado.establecimientos.map((e) => (
                  <li key={e.establecimiento_id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-surface px-3 py-2">
                    <span className="font-mono text-[11px] text-text-secondary truncate">{e.branch_id ?? 'sin branch_id'}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {!e.activo && <Badge variant="default">Inactivo</Badge>}
                      <Badge variant={FISCAL_STATUS[e.fiscal_status]?.variant ?? 'default'}>
                        {FISCAL_STATUS[e.fiscal_status]?.label ?? e.fiscal_status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-text-secondary mt-3">
              Solo un establecimiento en estado <span className="font-semibold">Listo</span> habilita la emisión de DTE desde la sucursal vinculada.
            </p>
          </section>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!crearMutation.isPending) setDialogOpen(v) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva empresa</DialogTitle>
            <DialogDescription>
              Crea el tenant en el DTE Service (fuente de verdad fiscal) y la proyección operativa en el POS con el mismo identificador.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Razón social" />
            <Input label="NIT" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} required placeholder="0614-xxxxxx-xxx-x" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="NRC" value={form.nrc} onChange={(e) => setForm({ ...form, nrc: e.target.value })} placeholder="Opcional" />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Opcional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={crearMutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={crearMutation.isPending} disabled={!form.nombre.trim() || !form.nit.trim()}>
                Crear empresa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}