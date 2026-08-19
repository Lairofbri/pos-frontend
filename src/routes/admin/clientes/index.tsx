import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { queryDefaults } from '../../../config/queries'
import { listarClientes, crearCliente, actualizarCliente, eliminarCliente } from './api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { SidePanel } from '../../../components/shared/SidePanel'
import { LoadingOverlay } from '../../../components/shared/LoadingOverlay'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { useCatalogo } from '../../../hooks/useCatalogo'
import type { Cliente } from '../../../types'

const columns: Column<Cliente>[] = [
  {
    key: 'nombre',
    header: 'Nombre',
    sortable: true,
    render: (c) => <span>{c.razon_social || (c.nombre + (c.apellido ? ` ${c.apellido}` : ''))}</span>,
  },
  {
    key: 'tipo_cliente',
    header: 'Tipo',
    render: (c) => c.tipo_cliente === 'juridico'
      ? <Badge variant="info">Empresa</Badge>
      : <Badge variant="default">Natural</Badge>,
  },
  { key: 'telefono', header: 'Teléfono', render: (c) => <span className="text-text-secondary text-xs font-mono">{c.telefono ?? '—'}</span> },
  { key: 'email', header: 'Email', render: (c) => <span className="text-text-secondary text-xs">{c.email ?? '—'}</span> },
  {
    key: 'nit',
    header: 'Documento',
    render: (c) => c.nit
      ? <span className="text-xs font-mono">{c.nit}</span>
      : c.numero_documento
        ? <span className="text-xs font-mono">{c.tipo_documento?.toUpperCase()}: {c.numero_documento}</span>
        : <span className="text-text-secondary">—</span>,
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (c) => <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
]

const FORM_INICIAL = {
  nombre: '', apellido: '', telefono: '', email: '',
  tipo_cliente: 'natural' as 'natural' | 'juridico',
  tipo_documento: '', numero_documento: '', nit: '', nrc: '',
  razon_social: '', cod_actividad: '', desc_actividad: '',
  direccion: '', municipio: '', departamento: '',
}

export default function ClientesPage() {
  const queryClient = useQueryClient()
  const { data: tiposDocumento } = useCatalogo('tipos_documento')
  const { data: departamentos } = useCatalogo('departamentos')
  const { data: sectores } = useCatalogo('sectores_economicos')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Cliente | null>(null)
  const [form, setForm] = useState(FORM_INICIAL)

  const deptoCode = useMemo(() => {
    const v = String(form.departamento || '').padStart(2, '0')
    if (v === '00') return ''
    const result = (/^\d{2}$/.test(v) ? v : departamentos?.find(d => String(d.label).toLowerCase() === v.toLowerCase())?.valor || '') as string
    return String(result).padStart(2, '0') || ''
  }, [form.departamento, departamentos])

  const municipiosQuery = useCatalogo(
    'municipios',
    deptoCode ? { depto: deptoCode } : undefined
  )
  const municipios = municipiosQuery.data

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => listarClientes(),
    ...queryDefaults('clientes'),
  })

  const sectorName = (codigo: string) => sectores?.find(s => s.valor === codigo)?.label || codigo

  const muniCode = useMemo(() => {
    const v = String(form.municipio || '').padStart(4, '0')
    if (v === '0000') return ''
    const result = (/^\d{4}$/.test(v) ? v : municipios?.find(m => String(m.label).toLowerCase() === v.toLowerCase())?.valor || '') as string
    return String(result).padStart(4, '0') || ''
  }, [form.municipio, municipios])

  const cleanForm = () => ({
    nombre: form.tipo_cliente === 'juridico' ? (form.razon_social || form.nombre) : form.nombre,
    apellido: form.tipo_cliente === 'juridico' ? undefined : (form.apellido || undefined),
    telefono: form.telefono || undefined,
    email: form.email || undefined,
    tipo_cliente: form.tipo_cliente,
    tipo_documento: form.tipo_cliente === 'juridico' ? undefined : ((form.tipo_documento || undefined) as Cliente['tipo_documento']),
    numero_documento: form.tipo_cliente === 'juridico' ? undefined : (form.numero_documento || undefined),
    nit: form.nit || undefined,
    nrc: form.nrc || undefined,
    razon_social: form.tipo_cliente === 'juridico' ? (form.razon_social || undefined) : undefined,
    cod_actividad: form.tipo_cliente === 'juridico' ? (form.cod_actividad || undefined) : undefined,
    desc_actividad: form.tipo_cliente === 'juridico' ? (sectorName(form.cod_actividad) || undefined) : undefined,
    direccion: form.direccion || undefined,
    municipio: muniCode || undefined,
    departamento: deptoCode || undefined,
  })

  const crearMutation = useApiMutation({
    mutationFn: () => crearCliente(cleanForm()),
    queryKey: ['clientes'],
    successMessage: 'Cliente creado exitosamente',
    onSuccess: () => cerrarPanel(),
  })

  const editarMutation = useApiMutation({
    mutationFn: () => editando ? actualizarCliente(editando.id, cleanForm()) : Promise.reject(new Error('No editando')),
    queryKey: ['clientes'],
    successMessage: 'Cliente actualizado exitosamente',
    onSuccess: () => cerrarPanel(),
  })

  const eliminarMutation = useApiMutation({
    mutationFn: () => confirmDelete ? eliminarCliente(confirmDelete.id) : Promise.reject(new Error('No confirmado')),
    queryKey: ['clientes'],
    successMessage: 'Cliente eliminado exitosamente',
    onSuccess: () => setConfirmDelete(null),
  })

  const abrirNuevo = () => { setEditando(null); setForm(FORM_INICIAL); setPanelOpen(true) }

  const abrirEditar = (c: Cliente) => {
    setEditando(c)
    let depto = c.departamento ?? ''
    let muni = c.municipio ?? ''
    if (depto && !/^\d{2}$/.test(depto)) {
      const cachedDeptos = queryClient.getQueryData<{ valor: string; label: string }[]>(
        ['catalogos', 'departamentos', undefined]
      )
      const found = cachedDeptos?.find(d => String(d.label).toLowerCase() === depto.toLowerCase())
      if (found) depto = String(found.valor).padStart(2, '0')
    }
    if (muni && !/^\d{4}$/.test(muni)) {
      const cachedMunis = queryClient.getQueryData<{ valor: string; label: string; depto?: string }[]>(
        depto ? ['catalogos', 'municipios', { depto }] : ['catalogos', 'municipios', undefined]
      )
      const found = cachedMunis?.find(m => String(m.label).toLowerCase() === muni.toLowerCase())
      if (found) muni = String(found.valor).padStart(4, '0')
    }
    setForm({
      nombre: c.nombre, apellido: c.apellido ?? '', telefono: c.telefono ?? '', email: c.email ?? '',
      tipo_cliente: c.tipo_cliente ?? 'natural',
      tipo_documento: c.tipo_documento ?? '', numero_documento: c.numero_documento ?? '',
      nit: c.nit ?? '', nrc: c.nrc ?? '', razon_social: c.razon_social ?? '',
      cod_actividad: c.cod_actividad ?? '', desc_actividad: c.desc_actividad ?? '',
      direccion: c.direccion ?? '', municipio: muni, departamento: depto,
    })
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }
  const guardar = () => { if (editando) editarMutation.mutate(); else crearMutation.mutate() }
  const isMutating = crearMutation.isPending || editarMutation.isPending
  const esJuridico = form.tipo_cliente === 'juridico'

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

      <SidePanel open={panelOpen} onClose={() => { if (!isMutating) cerrarPanel() }} title={editando ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <div className="relative">
          {isMutating && <LoadingOverlay />}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                variant={!esJuridico ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setForm({ ...form, tipo_cliente: 'natural', razon_social: '', cod_actividad: '', desc_actividad: '' })}
              >
                Persona Natural
              </Button>
              <Button
                variant={esJuridico ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setForm({ ...form, tipo_cliente: 'juridico', tipo_documento: '', numero_documento: '' })}
              >
                Empresa / Jurídico
              </Button>
            </div>

            {esJuridico ? (
              <>
                <Input label="Razón social" value={form.razon_social} onChange={(e) => setForm({ ...form, razon_social: e.target.value, nombre: e.target.value })} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="NIT" placeholder="0000-000000-000-0" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
                  <Input label="NRC" value={form.nrc} onChange={(e) => setForm({ ...form, nrc: e.target.value })} />
                </div>
                <Select
                  label="Actividad económica"
                  placeholder="Seleccionar..."
                  options={(sectores ?? []).slice(0, 100).map(s => ({ value: s.valor, label: `${s.valor} — ${s.label}` }))}
                  value={form.cod_actividad}
                  onValueChange={(v) => setForm({ ...form, cod_actividad: v })}
                />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                  <Input label="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
                </div>
                <Select label="Tipo documento" options={(tiposDocumento ?? []).map((t) => ({ value: t.valor, label: t.label }))} value={form.tipo_documento} onValueChange={(v) => setForm({ ...form, tipo_documento: v })} placeholder="Seleccionar..." />
                <Input label="Número documento" value={form.numero_documento} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })} />
                <Input label="NIT (opcional)" placeholder="0000-000000-000-0" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
              </>
            )}

            <hr className="border-border" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Contacto</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <hr className="border-border" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Dirección fiscal</p>
            <Input label="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Departamento"
                placeholder="Seleccionar..."
                options={(departamentos ?? []).map(d => ({ value: String(d.valor).padStart(2, '0'), label: d.label }))}
                value={deptoCode}
                onValueChange={(v) => setForm({ ...form, departamento: String(v).padStart(2, '0'), municipio: '' })}
              />
              <Select
                label="Municipio"
                placeholder={deptoCode ? 'Seleccionar...' : 'Primero elija departamento'}
                options={(municipios ?? []).map(m => ({ value: String(m.valor).padStart(4, '0'), label: m.label }))}
                value={muniCode}
                onValueChange={(v) => setForm({ ...form, municipio: String(v).padStart(4, '0') })}
                disabled={!deptoCode}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={guardar} loading={isMutating} disabled={!form.nombre && !form.razon_social}>
                {editando ? 'Guardar cambios' : 'Crear cliente'}
              </Button>
              {editando && <Button variant="danger" onClick={() => setConfirmDelete(editando)}>Eliminar</Button>}
            </div>
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
