import api from '../../../api/client'
import type { Cliente } from '../../../types'

interface ClienteRaw {
  id: string
  nombre: string
  apellido: string | null
  nombre_completo: string | null
  telefono: string | null
  email: string | null
  tipo_documento: string | null
  numero_documento: string | null
  nit: string | null
  nrc: string | null
  razon_social: string | null
  es_empresa: boolean | null
  direccion: string | null
  municipio: string | null
  departamento: string | null
  activo: boolean
}

function parseCliente(raw: ClienteRaw): Cliente {
  return {
    id: raw.id,
    nombre: raw.nombre,
    apellido: raw.apellido ?? undefined,
    nombre_completo: raw.nombre_completo ?? undefined,
    telefono: raw.telefono ?? undefined,
    email: raw.email ?? undefined,
    tipo_documento: raw.tipo_documento ?? '',
    numero_documento: raw.numero_documento ?? undefined,
    nit: raw.nit ?? undefined,
    nrc: raw.nrc ?? undefined,
    razon_social: raw.razon_social ?? undefined,
    es_empresa: raw.es_empresa ?? undefined,
    direccion: raw.direccion ?? undefined,
    municipio: raw.municipio ?? undefined,
    departamento: raw.departamento ?? undefined,
    activo: raw.activo,
  }
}

export const buscarClientes = (q: string) =>
  api.get<{ ok: boolean; data: ClienteRaw[] }>('/clientes/buscar', { params: { q } })
    .then(r => r.data.data.map(parseCliente))

export const listarClientes = (pagina?: number) =>
  api.get<{ ok: boolean; data: { clientes: ClienteRaw[] } }>('/clientes', { params: pagina ? { pagina } : {} })
    .then(r => r.data.data.clientes.map(parseCliente))

export const crearCliente = (data: Partial<Cliente>) =>
  api.post<{ ok: boolean; data: { cliente: ClienteRaw } }>('/clientes', data)
    .then(r => parseCliente(r.data.data.cliente))

export const actualizarCliente = (id: string, data: Partial<Cliente>) =>
  api.patch<{ ok: boolean; data: { cliente: ClienteRaw } }>(`/clientes/${id}`, data)
    .then(r => parseCliente(r.data.data.cliente))

export const eliminarCliente = (id: string) =>
  api.delete(`/clientes/${id}`).then(r => r.data)
