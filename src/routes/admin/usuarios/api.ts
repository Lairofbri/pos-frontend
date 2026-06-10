import api from '../../../api/client'
import type { Usuario } from '../../../types'

interface UsuarioRaw {
  id: string
  tenant_id: string
  nombre: string
  apellido: string | null
  email: string | null
  rol: string
  activo: boolean
  sucursal_id: string | null
}

function parseUsuario(raw: UsuarioRaw): Usuario {
  return {
    id: raw.id,
    tenant_id: raw.tenant_id,
    nombre: raw.nombre,
    apellido: raw.apellido ?? undefined,
    email: raw.email ?? undefined,
    rol: raw.rol,
    activo: raw.activo,
    sucursal_id: raw.sucursal_id ?? undefined,
  }
}

export const listarUsuarios = () =>
  api.get<{ ok: boolean; data: { usuarios: UsuarioRaw[] } }>('/usuarios')
    .then(r => r.data.data.usuarios.map(parseUsuario))

export const obtenerUsuario = (id: string) =>
  api.get<{ ok: boolean; data: { usuario: UsuarioRaw } }>(`/usuarios/${id}`)
    .then(r => parseUsuario(r.data.data.usuario))

export const crearUsuario = (data: { nombre: string; apellido?: string; email?: string; pin: string; password?: string; rol: string; sucursal_id?: string }) =>
  api.post<{ ok: boolean; data: { usuario: UsuarioRaw } }>('/usuarios', data)
    .then(r => parseUsuario(r.data.data.usuario))

export const actualizarUsuario = (id: string, data: Partial<{ nombre: string; apellido: string; email: string; rol: string; activo: boolean; sucursal_id: string }>) =>
  api.patch<{ ok: boolean; data: { usuario: UsuarioRaw } }>(`/usuarios/${id}`, data)
    .then(r => parseUsuario(r.data.data.usuario))

export const resetearPin = (id: string, pin_nuevo: string) =>
  api.post(`/usuarios/${id}/resetear-pin`, { pin_nuevo }).then(r => r.data)
