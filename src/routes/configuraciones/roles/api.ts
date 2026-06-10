import api from '../../../api/client'

export interface Permiso {
  id: string
  nombre: string
  grupo: string
  descripcion?: string
}

export interface RolPermiso {
  codigo: string
  activo: boolean
}

export const listarRoles = () =>
  api.get<{ ok: boolean; data: string[] }>('/permisos/roles').then(r => r.data.data)

export const listarPermisos = () =>
  api.get<{ ok: boolean; data: Permiso[] }>('/permisos').then(r => r.data.data)

export const obtenerPermisosRol = (rol: string) =>
  api.get<{ ok: boolean; data: RolPermiso[] }>(`/permisos/rol/${rol}`).then(r => r.data.data)

export const actualizarPermisosRol = (rol: string, data: { permisos: { codigo: string; activo: boolean }[] }) =>
  api.put(`/permisos/rol/${rol}`, data).then(r => r.data)

export const resetPermisosRol = (rol: string) =>
  api.post(`/permisos/rol/${rol}/reset`).then(r => r.data)
