import { useState, useMemo } from 'react'
import { ClipboardList } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { listarRoles } from '../roles/api'
import { listarMenus, crearMenu, actualizarMenu, eliminarMenu, flattenTree } from './api'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '../../../components/ui/Toggle'
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { IconSelect } from '../../../components/shared/IconSelect'
import { useToastStore } from '../../../store/toastStore'
import { Icon } from '../../../components/shared/Icon'
import type { MenuItem } from '../../../types'

export default function MenusPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<MenuItem | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({ titulo: '', icono: '', ruta: '', parent_id: '', orden: '0', permiso_codigo: '', activo: true })

  const { data: arbol, isLoading } = useQuery({
    queryKey: ['configuraciones', 'menus'],
    queryFn: listarMenus,
    ...queryDefaults('configuraciones'),
  })

  const { data: roles } = useQuery({
    queryKey: ['roles-select'],
    queryFn: listarRoles,
    ...queryDefaults('roles-select'),
  })

  const itemsPlanos = useMemo(() => arbol ? flattenTree(arbol) : [], [arbol])

  const raices = useMemo(() => {
    if (!arbol) return []
    const result: MenuItem[] = []
    const walk = (items: MenuItem[]) => {
      for (const item of items) {
        result.push(item)
        if (item.children?.length) walk(item.children)
      }
    }
    walk(arbol)
    return result
  }, [arbol])

  const rolesOptions = (roles ?? []).map((r: string) => ({ value: r, label: r }))

  const crearMutation = useMutation({
    mutationFn: () => crearMenu({
      titulo: form.titulo,
      icono: form.icono || undefined,
      ruta: form.ruta || null,
      parent_id: form.parent_id || null,
      orden: parseInt(form.orden || '0'),
      permiso_codigo: form.permiso_codigo || undefined,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuraciones', 'menus'] }); cerrarPanel(); showToast({ type: 'success', message: 'Menú creado' }) },
  })

  const editarMutation = useMutation({
    mutationFn: () => {
      if (!editando) return Promise.reject()
      return actualizarMenu(editando.id, {
        titulo: form.titulo,
        icono: form.icono || undefined,
        ruta: form.ruta || null,
        parent_id: form.parent_id || null,
        orden: parseInt(form.orden || '0'),
        permiso_codigo: form.permiso_codigo || undefined,
        activo: form.activo,
      })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuraciones', 'menus'] }); cerrarPanel(); showToast({ type: 'success', message: 'Menú actualizado' }) },
  })

  const eliminarMutation = useMutation({
    mutationFn: () => confirmDelete ? eliminarMenu(confirmDelete.id) : Promise.reject(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuraciones', 'menus'] }); setConfirmDelete(null); showToast({ type: 'success', message: 'Menú eliminado' }) },
  })

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ titulo: '', icono: '', ruta: '', parent_id: '', orden: '0', permiso_codigo: '', activo: true })
    setPanelOpen(true)
  }

  const abrirEditar = (item: MenuItem) => {
    setEditando(item)
    setForm({
      titulo: item.titulo,
      icono: item.icono ?? '',
      ruta: item.ruta ?? '',
      parent_id: item.parent_id ?? '',
      orden: String(item.orden ?? 0),
      permiso_codigo: item.permiso_codigo ?? '',
      activo: item.activo ?? true,
    })
    setPanelOpen(true)
  }

  const cerrarPanel = () => { setPanelOpen(false); setEditando(null) }

  const guardar = () => { if (editando) editarMutation.mutate(); else crearMutation.mutate() }

  const cambiarOrden = async (item: MenuItem, direccion: 'up' | 'down') => {
    try {
      const flat = flattenTree(arbol ?? [])
      const idx = flat.findIndex((f) => f.item.id === item.id)
      if (idx === -1) return
      const targetIdx = direccion === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= flat.length) return
      const target = flat[targetIdx]
      const newOrden = target.item.orden + (direccion === 'up' ? -1 : 1)
      await actualizarMenu(item.id, { orden: newOrden })
      queryClient.invalidateQueries({ queryKey: ['configuraciones', 'menus'] })
    } catch {
      showToast({ type: 'error', message: 'Error al reordenar' })
    }
  }

  const raicesOptions = raices.map((r) => ({ value: r.id, label: r.titulo }))

  if (isLoading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>

  return (
    <>
      <div className="px-4 pb-4">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={abrirNuevo}>Nuevo Item</Button>
        </div>

        {itemsPlanos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ClipboardList className="size-10 text-text-secondary" />
            <p className="text-text-secondary text-sm font-body">Sin items de menú</p>
          </div>
        ) : (
          <div className="bg-bg-surface rounded-xl border border-border overflow-hidden">
            {itemsPlanos.map(({ item, level }) => {
              const tieneHijos = (item.children?.length ?? 0) > 0
              const estaExpandido = expanded.has(item.id)

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b border-border/50 hover:bg-bg-surface-hover transition-colors cursor-pointer ${
                    level > 0 ? 'border-l-2 border-l-accent/20' : ''
                  }`}
                  style={{ paddingLeft: `${16 + level * 24}px` }}
                  onClick={() => abrirEditar(item)}
                >
                  {tieneHijos ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(item.id) }}
                      className="size-5 flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer shrink-0 text-xs"
                    >
                      {estaExpandido ? '▼' : '▶'}
                    </button>
                  ) : (
                    <span className="w-5 shrink-0" />
                  )}

                  <span className="size-5 flex items-center justify-center shrink-0">
                    <Icon name={item.icono ?? ''} className="size-4" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-text-primary font-body truncate block">{item.titulo}</span>
                  </div>

                  {item.ruta ? (
                    <span className="text-[10px] font-mono text-text-secondary bg-bg-primary px-2 py-0.5 rounded hidden sm:block">
                      {item.ruta}
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-secondary bg-bg-primary px-2 py-0.5 rounded hidden sm:block italic">
                      Contenedor
                    </span>
                  )}

                  {item.permiso_codigo && (
                    <Badge variant="info">{item.permiso_codigo}</Badge>
                  )}

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => cambiarOrden(item, 'up')}
                      className="size-10 sm:size-6 rounded bg-bg-primary text-text-secondary hover:text-text-primary hover:border-accent border border-border cursor-pointer text-xs flex items-center justify-center"
                      title="Subir"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => cambiarOrden(item, 'down')}
                      className="size-10 sm:size-6 rounded bg-bg-primary text-text-secondary hover:text-text-primary hover:border-accent border border-border cursor-pointer text-xs flex items-center justify-center"
                      title="Bajar"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <SidePanel open={panelOpen} onClose={cerrarPanel} title={editando ? 'Editar Menú' : 'Nuevo Item'}>
        <div className="flex flex-col gap-4">
          <Input label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />

          <IconSelect
            label="Icono"
            value={form.icono}
            onChange={(v) => setForm({ ...form, icono: v })}
          />

          <Input label="Ruta" value={form.ruta} onChange={(e) => setForm({ ...form, ruta: e.target.value })} placeholder="/admin/productos (vacío = contenedor)" />

          <Select
            label="Padre"
            options={raicesOptions}
            value={form.parent_id}
            onValueChange={(v) => setForm({ ...form, parent_id: v })}
            placeholder="Raíz (sin padre)"
          />

          <Input label="Orden" type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} min={0} />

          <Select
            label="Visibilidad por rol"
            options={rolesOptions}
            value={form.permiso_codigo}
            onValueChange={(v) => setForm({ ...form, permiso_codigo: v })}
            placeholder="Todos los roles"
          />

          <Toggle
            checked={form.activo}
            onChange={(v) => setForm({ ...form, activo: v })}
            label="Activo"
          />

          <div className="flex gap-2">
            <Button className="flex-1" onClick={guardar} loading={crearMutation.isPending || editarMutation.isPending} disabled={!form.titulo}>
              {editando ? 'Guardar cambios' : 'Crear item'}
            </Button>
            {editando && (
              <Button variant="danger" onClick={() => setConfirmDelete(editando)}>Eliminar</Button>
            )}
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar menú"
        message={`¿Desactivar "${confirmDelete?.titulo}"?`}
        onConfirm={() => eliminarMutation.mutate()}
        onCancel={() => setConfirmDelete(null)}
        loading={eliminarMutation.isPending}
      />
    </>
  )
}
