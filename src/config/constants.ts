export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TENANT_ID: 'tenant_id',
  USUARIO_DATA: 'usuario_data',
  SUCURSAL_ID: 'sucursal_id',
  // Agente local de impresión (AmberPrint). Es un secreto del equipo, no del
  // backend: vive solo en el navegador de la caja y viaja a 127.0.0.1.
  AMBERPRINT_TOKEN: 'amberprint_token',
  AMBERPRINT_PUERTO: 'amberprint_puerto',
} as const

export const MAX_NIVEL_CATEGORIAS = 2
