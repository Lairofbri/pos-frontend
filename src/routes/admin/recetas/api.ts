import api from '../../../api/client'

export interface RecetaIngrediente {
  ingrediente_id: string
  ingrediente_nombre: string
  cantidad: number
  unidad_medida_id: string
  unidad_nombre: string
  unidad_abrev: string
  preparacion: string | null
  ingrediente_stock?: number
}

export interface Receta {
  id: string
  producto_id: string
  producto_nombre: string
  precio: number
  imagen_url: string | null
  categoria_id: string | null
  categoria_nombre: string | null
  rendimiento: number
  instrucciones: string | null
  num_ingredientes: number
  ingredientes: RecetaIngrediente[]
  creado_en: string
}

interface RecetaListItem {
  id: string
  producto_id: string
  producto_nombre: string
  precio: string
  imagen_url: string | null
  categoria_id: string | null
  categoria_nombre: string | null
  rendimiento: number
  instrucciones: string | null
  num_ingredientes: number
  creado_en: string
}

interface Paginacion {
  total: number
  pagina: number
  limite: number
  paginas: number
}

export function listarRecetas(params?: { categoria_id?: string; busqueda?: string; pagina?: number; limite?: number }) {
  return api.get<{ ok: boolean; data: { recetas: RecetaListItem[]; paginacion: Paginacion } }>('/recetas', { params })
    .then(r => ({
      recetas: r.data.data.recetas.map((r) => ({
        ...r,
        precio: parseFloat(r.precio),
      })),
      paginacion: r.data.data.paginacion,
    }))
}

export function obtenerReceta(id: string) {
  return api.get<{ ok: boolean; data: Receta }>(`/recetas/${id}`)
    .then(r => ({
      ...r.data.data,
      precio: typeof r.data.data.precio === 'string' ? parseFloat(r.data.data.precio) : r.data.data.precio,
    }))
}

export function obtenerRecetaPorProducto(productoId: string) {
  return api.get<{ ok: boolean; data: Receta }>(`/recetas/producto/${productoId}`)
    .then(r => ({
      ...r.data.data,
      precio: typeof r.data.data.precio === 'string' ? parseFloat(r.data.data.precio) : r.data.data.precio,
    }))
}

export function crearReceta(data: {
  producto: { nombre: string; precio: number; categoria_id?: string | null; imagen_url?: string | null }
  rendimiento: number
  instrucciones?: string
  ingredientes: Array<{ ingrediente_id: string; cantidad: number; unidad_medida_id: string; preparacion?: string }>
}) {
  return api.post<{ ok: boolean; data: { receta: Receta } }>('/recetas', data)
    .then(r => r.data.data.receta)
}

export function actualizarReceta(id: string, data: {
  producto?: { nombre?: string; precio?: number; categoria_id?: string | null; imagen_url?: string | null }
  rendimiento?: number
  instrucciones?: string
  ingredientes?: Array<{ ingrediente_id: string; cantidad: number; unidad_medida_id: string; preparacion?: string }>
}) {
  return api.put<{ ok: boolean; data: { receta: Receta } }>(`/recetas/${id}`, data)
    .then(r => r.data.data.receta)
}

export function eliminarReceta(id: string) {
  return api.delete(`/recetas/${id}`).then(r => r.data)
}
