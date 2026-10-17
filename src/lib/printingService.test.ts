import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

/**
 * Pruebas del cliente del agente local (AmberPrint).
 *
 * No hay agente ni backend: se mockean `fetch` (loopback) y el axios del backend.
 * Lo que se verifica es el contrato que usan POS, Cocina y Cuentas: token, base64,
 * clasificación de errores y que un fallo del backend **no** llegue al agente.
 */

vi.mock('../api/client', () => ({
  default: { get: vi.fn() },
}))

import api from '../api/client'
import {
  detectarAgente,
  imprimirBytes,
  imprimirTicketOrden,
  guardarToken,
  guardarPuerto,
  agenteConfigurado,
  obtenerPuerto,
  esErrorImpresion,
  ErrorImpresion,
} from './printingService'

// ── localStorage mínimo (el módulo evita tocar el del navegador en Node) ──────
const almacen = new Map<string, string>()
const localStorageFalso = {
  getItem: (clave: string) => almacen.get(clave) ?? null,
  setItem: (clave: string, valor: string) => almacen.set(clave, valor),
  removeItem: (clave: string) => almacen.delete(clave),
  clear: () => almacen.clear(),
}

const respuestaJson = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })

const respuestaOk = (data: unknown) => respuestaJson({ ok: true, data })
const respuestaError = (status: number, codigo: string, mensaje = 'detalle') =>
  respuestaJson({ ok: false, error: { codigo, mensaje } }, status)

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  almacen.clear()
  fetchMock.mockReset()
  vi.stubGlobal('localStorage', localStorageFalso)
  vi.stubGlobal('fetch', fetchMock)
  guardarToken('token-de-prueba')
  guardarPuerto(9101)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('configuración local del equipo', () => {
  it('guarda el token y el puerto, y valida el rango del puerto', () => {
    expect(agenteConfigurado()).toBe(true)
    expect(obtenerPuerto()).toBe(9101)

    guardarPuerto(1)
    expect(obtenerPuerto()).toBe(1)

    guardarPuerto(70000)
    expect(obtenerPuerto()).toBe(9101)

    guardarToken('   ')
    expect(agenteConfigurado()).toBe(false)
  })
})

describe('detectarAgente', () => {
  it('devuelve el estado cuando el agente responde', async () => {
    fetchMock.mockResolvedValueOnce(
      respuestaOk({ ok: true, agente: 'AmberPrint', version: '1.1.0', estado: 'ok', puerto: 9101, papelMm: 80, corte: true }),
    )

    const estado = await detectarAgente()

    expect(estado?.agente).toBe('AmberPrint')
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:9101/health',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('devuelve null (sin lanzar) si el agente no está instalado', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(detectarAgente()).resolves.toBeNull()
  })
})

describe('imprimirBytes', () => {
  it('exige token antes de llamar al agente', async () => {
    guardarToken('')

    const promesa = imprimirBytes(new Uint8Array([0x1b, 0x40]))

    await expect(promesa).rejects.toBeInstanceOf(ErrorImpresion)
    await expect(promesa).rejects.toMatchObject({ codigo: 'SIN_TOKEN', reintentable: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envía los bytes en base64 con el Bearer y la etiqueta del trabajo', async () => {
    const resultado = {
      jobId: 'j1', estado: 'enviado', impresora: 'POS-80C', tipo: 'usb', destino: 'POS-80C',
      bytes: 3, duracionMs: 12, trabajo: 'pre-cuenta:abc', aviso: 'Enviado a la cola.',
    }
    fetchMock.mockResolvedValueOnce(respuestaOk(resultado))

    const enviado = await imprimirBytes(new Uint8Array([0x1b, 0x40, 0xff]), { trabajo: 'pre-cuenta:abc' })

    expect(enviado.estado).toBe('enviado')
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toBe('http://127.0.0.1:9101/print')
    expect(opciones?.method).toBe('POST')

    const headers = opciones?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer token-de-prueba')

    const cuerpo = JSON.parse(String(opciones?.body))
    expect(cuerpo.trabajo).toBe('pre-cuenta:abc')
    expect(cuerpo.escpos_base64).toBe('G0D/')
  })

  it('clasifica el origen no permitido como error no reintentable', async () => {
    fetchMock.mockResolvedValueOnce(respuestaError(403, 'ORIGEN_NO_PERMITIDO', 'El origen no está autorizado.'))

    const error = await imprimirBytes(new Uint8Array([0x1b])).catch((e: unknown) => e)

    expect(esErrorImpresion(error)).toBe(true)
    expect(error).toMatchObject({ codigo: 'ORIGEN_NO_PERMITIDO', reintentable: false })
    expect((error as Error).message).toBe('El origen no está autorizado.')
  })

  it('marca como reintentable un 500 del agente', async () => {
    fetchMock.mockResolvedValueOnce(respuestaError(500, 'ERROR_IMPRESION', 'La cola falló.'))

    const error = await imprimirBytes(new Uint8Array([0x1b])).catch((e: unknown) => e)

    expect(error).toMatchObject({ codigo: 'ERROR_IMPRESION', reintentable: true })
  })

  it('traduce el timeout del AbortController a TIMEOUT', async () => {
    const abortado = Object.assign(new Error('aborted'), { name: 'AbortError' })
    fetchMock.mockRejectedValueOnce(abortado)

    const error = await imprimirBytes(new Uint8Array([0x1b])).catch((e: unknown) => e)

    expect(error).toMatchObject({ codigo: 'TIMEOUT', reintentable: true })
  })

  it('traduce una caída de red a AGENTE_AUSENTE', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const error = await imprimirBytes(new Uint8Array([0x1b])).catch((e: unknown) => e)

    expect(error).toMatchObject({ codigo: 'AGENTE_AUSENTE', reintentable: true })
  })
})

describe('imprimirTicketOrden', () => {
  it('pide los bytes al backend y los manda al agente sin inventar nada', async () => {
    const bytes = new Uint8Array([0x1b, 0x40, 0x1b, 0x64, 0x01])
    vi.mocked(api.get).mockResolvedValueOnce({ data: bytes.buffer })
    fetchMock.mockResolvedValueOnce(respuestaOk({ estado: 'enviado', bytes: bytes.length, aviso: 'ok' }))

    await imprimirTicketOrden('11111111-1111-4111-8111-111111111111', 'factura')

    expect(api.get).toHaveBeenCalledWith(
      '/impresion/ticket-escpos/11111111-1111-4111-8111-111111111111',
      expect.objectContaining({ params: { tipo: 'factura' }, responseType: 'arraybuffer' }),
    )
    const cuerpo = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(cuerpo.escpos_base64).toBe(btoa(String.fromCharCode(...bytes)))
    expect(cuerpo.trabajo).toBe('factura:11111111-1111-4111-8111-111111111111')
  })

  it('si el backend falla, NO llama al agente', async () => {
    vi.mocked(api.get).mockRejectedValueOnce({ response: { data: { mensaje: 'El DTE no está aceptado.' } } })

    const error = await imprimirTicketOrden('11111111-1111-4111-8111-111111111111', 'factura').catch((e: unknown) => e)

    expect(error).toMatchObject({ codigo: 'ERROR_BACKEND' })
    expect((error as Error).message).toBe('El DTE no está aceptado.')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
