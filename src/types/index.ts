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
  usuario_id: string
  pin: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  usuario: Usuario
}

export interface Usuario {
  id: string
  tenant_id: string
  nombre: string
  apellido?: string
  email?: string
  rol: string
  pin?: string
  sucursal_id?: string
  activo?: boolean
}

export interface MenuItem {
  id: string
  titulo: string
  icono: string
  ruta: string | null
  orden: number
  permiso_codigo?: string
  parent_id?: string | null
  activo?: boolean
  children: MenuItem[]
}

export interface MenuItemRaw {
  id: string
  titulo: string
  icono?: string
  ruta?: string | null
  parent_id?: string | null
  orden: number
  permiso_codigo?: string
  activo: boolean
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria_id?: string
  categoria_nombre?: string
  categoria_color?: string
  imagen_url?: string
  codigo?: string
  tiene_stock: boolean
  stock_actual: number
  stock_minimo: number
  orden: number
  activo: boolean
}

export interface Categoria {
  id: string
  parent_id: string | null
  nombre: string
  descripcion?: string
  icono?: string
  color?: string
  orden: number
  activo: boolean
  hijos?: Categoria[]
}

export interface ComboProducto {
  producto_id: string
  cantidad: number
  nombre?: string
  precio?: number
}

export interface Combo {
  id: string
  nombre: string
  precio: number
  productos: ComboProducto[]
  activo: boolean
}

export interface Mesa {
  id: string
  numero: string
  nombre?: string
  capacidad: number
  zona: string
  estado: 'disponible' | 'ocupada' | 'reservada' | 'inactiva'
  activo: boolean
  orden_activa?: Orden | null
}

export interface Pago {
  id: string
  metodo: 'efectivo' | 'tarjeta' | 'mixto'
  monto_efectivo: number
  monto_tarjeta: number
  total_pagado: number
  vuelto: number
  referencia_tarjeta?: string
  creado_en: string
}

export interface Orden {
  id: string
  tipo: 'mesa' | 'rapido' | 'delivery'
  estado: 'abierta' | 'en_proceso' | 'lista' | 'entregada' | 'pagada' | 'cancelada'
  numero_orden: number
  origen: string
  mesa_id?: string
  mesa_numero?: string
  zona?: string
  cliente_id?: string
  cliente_nombre?: string
  usuario_id: string
  usuario_nombre: string
  subtotal: number
  porcentaje_descuento: number
  descuento: number
  total: number
  gravado: number
  iva: number
  propina_porcentaje: number
  propina_monto: number
  notas?: string
  items: OrdenItem[]
  pagos: Pago[]
  creado_en: string
  actualizado_en?: string
  cerrado_en?: string
}

export interface OrdenItem {
  id: string
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  descuento_porcentaje: number
  notas?: string
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'cancelado'
  enviado_en?: string
}

export interface Cliente {
  id: string
  nombre: string
  apellido?: string
  nombre_completo?: string
  telefono?: string
  email?: string
  tipo_documento: string
  numero_documento?: string
  nit?: string
  nrc?: string
  razon_social?: string
  es_empresa?: boolean
  direccion?: string
  municipio?: string
  departamento?: string
  activo: boolean
}

export interface CajaMetodoResumen {
  metodo: string
  cantidad_ordenes: number
  total: number
}

export interface CajaTurno {
  id: string
  estado: 'abierta' | 'cerrada'
  monto_inicial: number
  usuario_apertura: string
  usuario_cierre?: string
  fecha_apertura: string
  fecha_cierre?: string
  notas_apertura?: string
  notas_cierre?: string
}

export interface CajaCuadre {
  id: string
  estado: string
  monto_inicial: number
  total_esperado: number
  monto_final: number
  diferencia: number
  total_ventas: number
  total_efectivo: number
  total_tarjeta: number
  total_retiros: number
  total_depositos: number
  notas_cierre?: string
  usuario_apertura: string
  usuario_cierre?: string
  fecha_apertura: string
  fecha_cierre?: string
  metodos: CajaMetodoResumen[]
  movimientos: MovimientoCaja[]
}

export interface MovimientoCaja {
  id: string
  tipo: 'ingreso' | 'retiro' | 'deposito'
  monto: number
  motivo: string
  metodo_pago?: string
  orden_id?: string
  usuario_nombre: string
  creado_en: string
}
