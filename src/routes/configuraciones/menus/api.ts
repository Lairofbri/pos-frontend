import api from '../../../api/client'
import type { MenuItem, MenuItemRaw } from '../../../types'

interface MenuItemRawResponse {
  id: string
  titulo: string
  icono: string | null
  ruta: string | null
  parent_id: string | null
  orden: number
  permiso_codigo: string | null
  activo: boolean
}

function parseRaw(raw: MenuItemRawResponse): MenuItemRaw {
  return {
    id: raw.id,
    titulo: raw.titulo,
    icono: raw.icono ?? undefined,
    ruta: raw.ruta,
    parent_id: raw.parent_id,
    orden: raw.orden,
    permiso_codigo: raw.permiso_codigo ?? undefined,
    activo: raw.activo,
  }
}

export function flattenTree(items: MenuItem[], level = 0): Array<{ item: MenuItem; level: number }> {
  const result: Array<{ item: MenuItem; level: number }> = []
  for (const item of items) {
    result.push({ item, level })
    if (item.children?.length > 0) {
      result.push(...flattenTree(item.children, level + 1))
    }
  }
  return result
}

export const listarMenus = () =>
  api.get<{ ok: boolean; data: MenuItem[] }>('/menus')
    .then(r => r.data.data)

export const obtenerMenu = (id: string) =>
  api.get<{ ok: boolean; data: MenuItemRaw }>(`/menus/${id}`)
    .then(r => r.data.data)

export const crearMenu = (data: { titulo: string; icono?: string; ruta?: string | null; parent_id?: string | null; orden?: number; permiso_codigo?: string }) =>
  api.post<{ ok: boolean; data: { menu: MenuItemRawResponse } }>('/menus', data)
    .then(r => parseRaw(r.data.data.menu))

export const actualizarMenu = (id: string, data: Partial<{ titulo: string; icono: string; ruta: string | null; parent_id: string | null; orden: number; permiso_codigo: string; activo: boolean }>) =>
  api.patch<{ ok: boolean; data: { menu: MenuItemRawResponse } }>(`/menus/${id}`, data)
    .then(r => parseRaw(r.data.data.menu))

export const eliminarMenu = (id: string) =>
  api.delete(`/menus/${id}`).then(r => r.data)
