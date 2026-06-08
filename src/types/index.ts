export interface Tenant {
  id: string
  nombre: string
  logo_url?: string
}

export interface LoginRequest {
  email: string
  password: string
  tenant_id: string
}

export interface LoginPinRequest {
  pin: string
  tenant_id: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  usuario: Usuario
}

export interface Usuario {
  id: string
  tenant_id: string
  rol: string
  nombre: string
  email: string
}

export interface MenuItem {
  id: string
  titulo: string
  icono: string
  ruta: string | null
  orden: number
  children: MenuItem[]
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria_id?: string
  activo: boolean
  tiene_stock: boolean
  stock_actual: number
  imagen_url?: string
}

export interface Categoria {
  id: string
  nombre: string
  color?: string
  activo: boolean
}

export interface Mesa {
  id: string
  numero: number
  capacidad: number
  zona: string
  activa: boolean
  ocupada?: boolean
}

export interface Orden {
  id: string
  mesa_id: string
  mesa_numero: number
  zona: string
  cliente_nombre?: string
  estado: 'abierta' | 'en_cocina' | 'completada' | 'pagada'
  items: OrdenItem[]
  total: number
  created_at: string
}

export interface OrdenItem {
  id: string
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  modificadores?: string[]
  notas?: string
  estado: 'pendiente' | 'en_cocina' | 'listo' | 'servido'
}

export interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
  notas?: string
}

export interface MovimientoCaja {
  id: string
  tipo: 'apertura' | 'cierre' | 'ingreso' | 'egreso'
  monto: number
  descripcion: string
  created_at: string
}

export interface CajaActiva {
  id: string
  abierta: boolean
  monto_inicial: number
  monto_actual: number
  abierta_por: string
  created_at: string
}
