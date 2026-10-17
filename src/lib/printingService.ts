import type { AxiosError } from 'axios'
import api from '../api/client'
import { STORAGE_KEYS } from '../config/constants'

/**
 * Cliente del agente local de impresión (AmberPrint) + obtención de los bytes
 * ESC/POS del backend.
 *
 * El navegador no puede imprimir solo (spec §4.1): el backend genera los bytes
 * (`GET /impresion/ticket-escpos/:ordenId`) y el agente local los escribe en la
 * impresora. Esta utilidad es el único punto de contacto con `127.0.0.1:9101`.
 *
 * No usa el axios de `api/client.ts` (ese apunta al backend y muestra toasts
 * globales): el agente responde en loopback, sin JWT y con errores tipados que
 * la UI necesita distinguir (`verificar.txt` §5, §11).
 */

export type TipoTicket = 'pre-cuenta' | 'ticket-consumo' | 'cocina' | 'factura'

export type CodigoErrorImpresion =
  | 'SIN_TOKEN'
  | 'AGENTE_AUSENTE'
  | 'TIMEOUT'
  | 'ORIGEN_NO_PERMITIDO'
  | 'TOKEN_REQUERIDO'
  | 'TOKEN_INVALIDO'
  | 'DESTINO_NO_PERMITIDO'
  | 'IMPRESORA_NO_ENCONTRADA'
  | 'LIMITE_TASAS'
  | 'PAYLOAD_MUY_GRANDE'
  | 'ERROR_IMPRESION'
  | 'ERROR_AGENTE'
  | 'ERROR_BACKEND'

/** Error de impresión con la causa clasificada (para mensajes y reintentos). */
export class ErrorImpresion extends Error {
  readonly codigo: CodigoErrorImpresion
  readonly reintentable: boolean

  constructor(codigo: CodigoErrorImpresion, mensaje: string, reintentable = false) {
    super(mensaje)
    this.name = 'ErrorImpresion'
    this.codigo = codigo
    this.reintentable = reintentable
  }
}

export const esErrorImpresion = (err: unknown): err is ErrorImpresion => err instanceof ErrorImpresion

// ── Configuración local (por equipo) ────────────────────────────────────────

const PUERTO_POR_DEFECTO = 9101

export const obtenerPuerto = (): number => {
  const valor = Number(localStorage.getItem(STORAGE_KEYS.AMBERPRINT_PUERTO))
  return Number.isInteger(valor) && valor >= 1 && valor <= 65535 ? valor : PUERTO_POR_DEFECTO
}

export const guardarPuerto = (puerto: number) => {
  localStorage.setItem(STORAGE_KEYS.AMBERPRINT_PUERTO, String(puerto))
}

export const obtenerToken = (): string => localStorage.getItem(STORAGE_KEYS.AMBERPRINT_TOKEN) ?? ''

export const guardarToken = (token: string) => {
  const limpio = token.trim()
  if (limpio) localStorage.setItem(STORAGE_KEYS.AMBERPRINT_TOKEN, limpio)
  else localStorage.removeItem(STORAGE_KEYS.AMBERPRINT_TOKEN)
}

export const agenteConfigurado = (): boolean => obtenerToken().length > 0

const urlAgente = (ruta: string) => `http://127.0.0.1:${obtenerPuerto()}${ruta}`

// ── Contratos del agente ────────────────────────────────────────────────────

export interface EstadoAgente {
  ok: boolean
  agente: string
  version: string
  estado: string
  puerto: number
  impresoraPorDefecto: string | null
  tipoPorDefecto: string
  papelMm: number
  corte: boolean
}

export interface ImpresoraSistema {
  nombre: string
  servidor: string | null
  predeterminada: boolean
}

export interface ListadoImpresorasAgente {
  impresoras: ImpresoraSistema[]
  impresoraPorDefecto: string | null
  tipoPorDefecto: string
  ipPorDefecto: string | null
  puertoPorDefecto: number
}

export interface PreferenciasImpresion {
  impresoraPorDefecto: string | null
  tipoPorDefecto: string
  ipPorDefecto: string | null
  puertoPorDefecto: number
  papelMm: number
  corte: boolean
  autoImpresion: boolean
  autoImpresionPreCuenta: boolean
  timeoutMs: number
  tamanoCeldaQr: number
}

export interface ConfigAgente {
  agente: string
  version: string
  directorioDatos: string
  puerto: number
  tokenConfigurado: boolean
  origenesPermitidos: string[]
  destinosPermitidos: string[]
  impresion: PreferenciasImpresion
  limites: { maxBytes: number; maxTrabajosPorMinuto: number }
}

export interface DestinoSolicitado {
  tipo?: 'usb' | 'red'
  ip?: string
  puerto?: number
  impresora?: string
}

export interface ResultadoEnvio {
  jobId: string
  estado: 'enviado'
  impresora: string | null
  tipo: string
  destino: string
  bytes: number
  duracionMs: number
  trabajo: string | null
  aviso: string
}

export interface CambiosConfigAgente {
  impresoraPorDefecto?: string | null
  tipoPorDefecto?: 'usb' | 'red'
  ipPorDefecto?: string | null
  puertoPorDefecto?: number
  papelMm?: 58 | 80
  corte?: boolean
  autoImpresion?: boolean
  autoImpresionPreCuenta?: boolean
}

// ── Peticiones al agente ────────────────────────────────────────────────────

const CODIGOS_CONOCIDOS: CodigoErrorImpresion[] = [
  'ORIGEN_NO_PERMITIDO', 'TOKEN_REQUERIDO', 'TOKEN_INVALIDO', 'DESTINO_NO_PERMITIDO',
  'IMPRESORA_NO_ENCONTRADA', 'TIMEOUT', 'LIMITE_TASAS', 'PAYLOAD_MUY_GRANDE', 'ERROR_IMPRESION',
]

const normalizarCodigo = (codigo: unknown): CodigoErrorImpresion =>
  CODIGOS_CONOCIDOS.includes(codigo as CodigoErrorImpresion) ? (codigo as CodigoErrorImpresion) : 'ERROR_AGENTE'

interface OpcionesPeticion {
  method?: 'GET' | 'POST' | 'PUT'
  body?: unknown
  token?: string
  timeoutMs?: number
}

async function peticion<T>(ruta: string, { method = 'GET', body, token, timeoutMs = 5000 }: OpcionesPeticion = {}): Promise<T> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs)

  let respuesta: Response
  try {
    respuesta = await fetch(urlAgente(ruta), {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controlador.signal,
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new ErrorImpresion('TIMEOUT', 'El agente de impresión no respondió a tiempo.', true)
    }
    throw new ErrorImpresion(
      'AGENTE_AUSENTE',
      'No se pudo contactar al agente de impresión local (AmberPrint). Verificá que esté instalado y en ejecución.',
      true,
    )
  } finally {
    clearTimeout(temporizador)
  }

  let json: { ok?: boolean; data?: unknown; error?: { codigo?: string; mensaje?: string }; extra?: { reintentable?: boolean } } | null = null
  try {
    json = await respuesta.json()
  } catch {
    // Cuerpo no-JSON (p. ej. 204 de preflight): se conserva `null`.
  }

  if (!respuesta.ok || json?.ok === false) {
    const reintentable = json?.extra?.reintentable ?? respuesta.status >= 500
    throw new ErrorImpresion(
      normalizarCodigo(json?.error?.codigo),
      json?.error?.mensaje ?? `El agente respondió con un error (HTTP ${respuesta.status}).`,
      reintentable,
    )
  }

  return (json?.data ?? json) as T
}

/** `GET /health` (sin token). Devuelve `null` si el agente no está disponible. */
export async function detectarAgente(timeoutMs = 1500): Promise<EstadoAgente | null> {
  try {
    return await peticion<EstadoAgente>('/health', { timeoutMs })
  } catch {
    return null
  }
}

/** `GET /printers` — impresoras instaladas en Windows (requiere token). */
export const listarImpresorasAgente = () =>
  peticion<ListadoImpresorasAgente>('/printers', { token: obtenerToken(), timeoutMs: 4000 })

/** `GET /config` — preferencias persistidas del agente. */
export const obtenerConfigAgente = () =>
  peticion<ConfigAgente>('/config', { token: obtenerToken(), timeoutMs: 4000 })

/** `PUT /config` — guarda preferencias (lo omitido no se toca). */
export const guardarConfigAgente = (cambios: CambiosConfigAgente) =>
  peticion<ConfigAgente>('/config', { method: 'PUT', body: cambios, token: obtenerToken(), timeoutMs: 4000 })

/** `POST /prueba` — ticket + QR de prueba local (lo usa la pantalla de configuración). */
export const probarImpresionAgente = (opciones: { impresora?: string; destino?: DestinoSolicitado; qr?: string; mensaje?: string } = {}) =>
  peticion<ResultadoEnvio>('/prueba', { method: 'POST', body: opciones, token: obtenerToken(), timeoutMs: 10000 })

// ── Impresión ───────────────────────────────────────────────────────────────

const aBase64 = (bytes: Uint8Array): string => {
  let binario = ''
  const trozo = 0x8000
  for (let i = 0; i < bytes.length; i += trozo) {
    binario += String.fromCharCode(...bytes.subarray(i, i + trozo))
  }
  return btoa(binario)
}

/** `POST /print` — envía el flujo ESC/POS al agente. */
export async function imprimirBytes(
  bytes: Uint8Array,
  opciones: { trabajo?: string; impresora?: string; destino?: DestinoSolicitado } = {},
): Promise<ResultadoEnvio> {
  if (!agenteConfigurado()) {
    throw new ErrorImpresion('SIN_TOKEN', 'Falta configurar el token del agente de impresión (Admin › Impresoras).')
  }

  return peticion<ResultadoEnvio>('/print', {
    method: 'POST',
    token: obtenerToken(),
    timeoutMs: 10000,
    body: {
      ...(opciones.impresora ? { impresora: opciones.impresora } : {}),
      ...(opciones.destino ? { destino: opciones.destino } : {}),
      escpos_base64: aBase64(bytes),
      ...(opciones.trabajo ? { trabajo: opciones.trabajo } : {}),
    },
  })
}

/**
 * Pide los bytes al backend y los envía al agente. No crea ni modifica nada:
 * la reimpresión es idempotente respecto de la venta y el DTE (decisión D5/D7).
 */
export async function imprimirTicketOrden(
  ordenId: string,
  tipo: TipoTicket,
  opciones: { impresora?: string; destino?: DestinoSolicitado } = {},
): Promise<ResultadoEnvio> {
  let bytes: Uint8Array
  try {
    const { data } = await api.get<ArrayBuffer>(`/impresion/ticket-escpos/${ordenId}`, {
      params: { tipo },
      responseType: 'arraybuffer',
    })
    bytes = new Uint8Array(data)
  } catch (err) {
    const mensaje = (err as AxiosError<{ mensaje?: string }>).response?.data?.mensaje
    throw new ErrorImpresion('ERROR_BACKEND', mensaje ?? 'No se pudo generar el ticket en el servidor.')
  }

  return imprimirBytes(bytes, { trabajo: `${tipo}:${ordenId}`, ...opciones })
}
