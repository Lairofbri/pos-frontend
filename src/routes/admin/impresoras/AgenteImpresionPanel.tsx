import { useCallback, useEffect, useState } from 'react'
import { Server, RefreshCw, Usb, Network, KeyRound, FlaskConical, QrCode, CheckCircle2 } from 'lucide-react'
import {
  detectarAgente, obtenerConfigAgente, guardarConfigAgente, listarImpresorasAgente,
  probarImpresionAgente, obtenerToken, guardarToken, obtenerPuerto, guardarPuerto,
  agenteConfigurado, esErrorImpresion,
} from '../../../lib/printingService'
import type { CambiosConfigAgente, ConfigAgente, EstadoAgente, ListadoImpresorasAgente } from '../../../lib/printingService'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Toggle } from '@/components/ui/Toggle'
import { useToastStore } from '../../../store/toastStore'

/** URL de demostración para la prueba del QR (consulta pública de Hacienda). */
const QR_DEMO =
  'https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=00000000-0000-4000-8000-000000000000&fechaEmi=2026-01-01'

interface FormPreferencias {
  impresoraPorDefecto: string
  tipoPorDefecto: 'usb' | 'red'
  ipPorDefecto: string
  puertoPorDefecto: number
  papelMm: 58 | 80
  corte: boolean
  autoImpresion: boolean
  autoImpresionPreCuenta: boolean
}

const mensajeDe = (err: unknown) =>
  esErrorImpresion(err) ? err.message : 'Ocurrió un error inesperado al hablar con el agente.'

const SECCION = 'dashboard-card p-5'
const CAMPO = 'text-xs font-semibold text-text-secondary uppercase tracking-wider'

export function AgenteImpresionPanel() {
  const showToast = useToastStore((s) => s.show)

  const [detectando, setDetectando] = useState(false)
  const [estado, setEstado] = useState<EstadoAgente | null>(null)
  const [config, setConfig] = useState<ConfigAgente | null>(null)
  const [listado, setListado] = useState<ListadoImpresorasAgente | null>(null)
  const [form, setForm] = useState<FormPreferencias | null>(null)
  const [tokenInput, setTokenInput] = useState(() => obtenerToken())
  const [puertoInput, setPuertoInput] = useState(() => String(obtenerPuerto()))
  const [guardando, setGuardando] = useState(false)
  const [probando, setProbando] = useState<'ticket' | 'qr' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const conectar = useCallback(async () => {
    setDetectando(true)
    setError(null)
    const agente = await detectarAgente()
    setEstado(agente)

    if (agente && agenteConfigurado()) {
      try {
        const [cfg, impresoras] = await Promise.all([obtenerConfigAgente(), listarImpresorasAgente()])
        setConfig(cfg)
        setListado(impresoras)
        setForm({
          impresoraPorDefecto: cfg.impresion.impresoraPorDefecto ?? '',
          tipoPorDefecto: cfg.impresion.tipoPorDefecto === 'red' ? 'red' : 'usb',
          ipPorDefecto: cfg.impresion.ipPorDefecto ?? '',
          puertoPorDefecto: cfg.impresion.puertoPorDefecto,
          papelMm: cfg.impresion.papelMm === 58 ? 58 : 80,
          corte: cfg.impresion.corte,
          autoImpresion: cfg.impresion.autoImpresion,
          autoImpresionPreCuenta: cfg.impresion.autoImpresionPreCuenta,
        })
      } catch (err) {
        setConfig(null)
        setListado(null)
        setForm(null)
        setError(mensajeDe(err))
      }
    } else {
      setConfig(null)
      setListado(null)
      setForm(null)
    }
    setDetectando(false)
  }, [])

  useEffect(() => {
    // Diferido para no llamar setState de forma síncrona dentro del efecto
    // (evita renders en cascada); el agente se detecta apenas monta el panel.
    const temporizador = setTimeout(() => void conectar(), 0)
    return () => clearTimeout(temporizador)
  }, [conectar])

  const guardarConexion = async () => {
    guardarToken(tokenInput)
    const puerto = Number(puertoInput)
    guardarPuerto(Number.isInteger(puerto) && puerto >= 1 && puerto <= 65535 ? puerto : 9101)
    await conectar()
  }

  const set = <K extends keyof FormPreferencias>(key: K, value: FormPreferencias[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  const guardarPreferencias = async () => {
    if (!form) return
    setGuardando(true)
    setError(null)
    try {
      const cambios: CambiosConfigAgente = {
        tipoPorDefecto: form.tipoPorDefecto,
        papelMm: form.papelMm,
        corte: form.corte,
        autoImpresion: form.autoImpresion,
        autoImpresionPreCuenta: form.autoImpresionPreCuenta,
      }
      if (form.tipoPorDefecto === 'usb') {
        // Cadena vacía = limpiar en el agente (null significa "no tocar").
        cambios.impresoraPorDefecto = form.impresoraPorDefecto
      } else {
        cambios.ipPorDefecto = form.ipPorDefecto
        cambios.puertoPorDefecto = form.puertoPorDefecto >= 1 && form.puertoPorDefecto <= 65535 ? form.puertoPorDefecto : 9100
      }

      const actualizada = await guardarConfigAgente(cambios)
      setConfig(actualizada)
      showToast({ type: 'success', message: 'Preferencias de impresión guardadas' })
    } catch (err) {
      setError(mensajeDe(err))
    } finally {
      setGuardando(false)
    }
  }

  const probar = async (modo: 'ticket' | 'qr') => {
    setProbando(modo)
    setError(null)
    try {
      const destino = form
        ? {
            tipo: form.tipoPorDefecto,
            ip: form.ipPorDefecto || undefined,
            puerto: form.puertoPorDefecto,
            impresora: form.impresoraPorDefecto || undefined,
          }
        : undefined
      const resultado = await probarImpresionAgente({
        ...(destino ? { destino } : {}),
        ...(modo === 'qr' ? { qr: QR_DEMO, mensaje: 'Prueba de codigo QR' } : { mensaje: 'Ticket de prueba desde el POS' }),
      })
      showToast({
        type: 'success',
        message: `Enviado a ${resultado.destino} (${resultado.bytes} bytes). ${resultado.aviso}`,
        description: 'Si el papel no sale, revisá la cola de impresión de Windows.',
      })
    } catch (err) {
      setError(mensajeDe(err))
    } finally {
      setProbando(null)
    }
  }

  const conectado = Boolean(estado)

  return (
    <section className={SECCION}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Server className="size-4 text-pos-accent" />
        <h2 className="font-semibold text-sm text-text-primary">Agente local de impresión (AmberPrint)</h2>
        <Badge variant={conectado ? 'success' : 'danger'} className="ml-auto">
          {detectando ? 'Detectando…' : conectado ? 'Conectado' : 'Sin respuesta'}
        </Badge>
        <button
          onClick={() => void conectar()}
          disabled={detectando}
          className="text-text-secondary hover:text-pos-accent transition-colors cursor-pointer disabled:opacity-40"
          title="Volver a detectar"
        >
          <RefreshCw className={`size-4 ${detectando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {conectado && estado && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary mb-4 font-mono">
          <span>v{estado.version}</span>
          <span>puerto {estado.puerto}</span>
          <span>papel {estado.papelMm} mm</span>
          <span>corte {estado.corte ? 'on' : 'off'}</span>
          {estado.impresoraPorDefecto && <span>por defecto: {estado.impresoraPorDefecto}</span>}
        </div>
      )}

      {!conectado && !detectando && (
        <p className="text-[11px] text-text-secondary mb-4">
          Instalá el agente AmberPrint en este equipo (doble clic en <span className="font-mono">instalar.cmd</span>) y
          pegá acá el token que muestra el instalador. El POS imprime directo a la impresora térmica, sin diálogo del
          navegador.
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
          <Input
            label="Token del agente"
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Pegá el token del instalador"
            autoComplete="off"
          />
          <Input
            label="Puerto"
            type="number"
            min={1}
            max={65535}
            value={puertoInput}
            onChange={(e) => setPuertoInput(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => void guardarConexion()} loading={detectando} variant="outline" size="sm" icon={<KeyRound className="size-3.5" />}>
            Guardar y conectar
          </Button>
          {config?.tokenConfigurado && (
            <span className="inline-flex items-center gap-1 text-[11px] text-success">
              <CheckCircle2 className="size-3.5" /> Token configurado en el agente
            </span>
          )}
        </div>

        {config && form && listado && (
          <>
            <div className="border-t border-border/50 pt-4 flex flex-col gap-4">
              <p className="text-[11px] text-text-secondary">
                Estos son los valores que el POS usa al imprimir. Dejan de depender del navegador: los aplica el agente.
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => set('tipoPorDefecto', 'usb')}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${form.tipoPorDefecto === 'usb' ? 'border-pos-accent bg-pos-accent/5 text-pos-accent' : 'border-border text-text-secondary hover:border-pos-accent/40'}`}
                >
                  <Usb className="size-4" /> USB (impresora de Windows)
                </button>
                <button
                  type="button"
                  onClick={() => set('tipoPorDefecto', 'red')}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${form.tipoPorDefecto === 'red' ? 'border-pos-accent bg-pos-accent/5 text-pos-accent' : 'border-border text-text-secondary hover:border-pos-accent/40'}`}
                >
                  <Network className="size-4" /> Ethernet (IP)
                </button>
              </div>

              {form.tipoPorDefecto === 'usb' ? (
                <Select
                  label="Impresora por defecto"
                  value={form.impresoraPorDefecto || undefined}
                  onValueChange={(v) => set('impresoraPorDefecto', v)}
                  placeholder={listado.impresoras.length ? 'Seleccionar impresora' : 'No hay impresoras instaladas'}
                  options={listado.impresoras.map((i) => ({
                    value: i.nombre,
                    label: i.predeterminada ? `${i.nombre} (predeterminada)` : i.nombre,
                  }))}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                  <Input
                    label="IP de la impresora"
                    value={form.ipPorDefecto}
                    onChange={(e) => set('ipPorDefecto', e.target.value)}
                    placeholder="192.168.1.100"
                  />
                  <Input
                    label="Puerto"
                    type="number"
                    value={String(form.puertoPorDefecto)}
                    onChange={(e) => set('puertoPorDefecto', Number(e.target.value))}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className={`${CAMPO} mb-2`}>Ancho de papel</p>
                  <div className="flex items-center gap-2">
                    {([80, 58] as const).map((mm) => (
                      <button
                        key={mm}
                        type="button"
                        onClick={() => set('papelMm', mm)}
                        className={`flex-1 h-9 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${form.papelMm === mm ? 'border-pos-accent bg-pos-accent/5 text-pos-accent' : 'border-border text-text-secondary hover:border-pos-accent/40'}`}
                      >
                        {mm} mm
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-text-primary">Corte de papel al terminar</span>
                    <Toggle checked={form.corte} onChange={(v) => set('corte', v)} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-text-primary">Auto-imprimir tras el cobro</span>
                    <Toggle checked={form.autoImpresion} onChange={(v) => set('autoImpresion', v)} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-text-primary">Auto-imprimir precuenta</span>
                    <Toggle checked={form.autoImpresionPreCuenta} onChange={(v) => set('autoImpresionPreCuenta', v)} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button onClick={() => void guardarPreferencias()} loading={guardando} size="sm">
                  Guardar preferencias
                </Button>
                <Button
                  onClick={() => void probar('ticket')}
                  loading={probando === 'ticket'}
                  disabled={!form.impresoraPorDefecto && form.tipoPorDefecto === 'usb'}
                  variant="outline"
                  size="sm"
                  icon={<FlaskConical className="size-3.5" />}
                >
                  Ticket de prueba
                </Button>
                <Button
                  onClick={() => void probar('qr')}
                  loading={probando === 'qr'}
                  disabled={!form.impresoraPorDefecto && form.tipoPorDefecto === 'usb'}
                  variant="outline"
                  size="sm"
                  icon={<QrCode className="size-3.5" />}
                >
                  Prueba del QR
                </Button>
              </div>
              <p className="text-[11px] text-text-secondary">
                El agente confirma «enviado», no «impreso»: si el papel no sale, revisá la cola de impresión de Windows.
              </p>
            </div>
          </>
        )}

        {conectado && !agenteConfigurado() && (
          <p className="text-[11px] text-pos-accent">
            El agente responde, pero falta el token para leer y cambiar su configuración.
          </p>
        )}

        {detectando && (
          <div className="flex justify-center py-2">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="text-[11px] text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2" role="alert">
            {error}
          </div>
        )}
      </div>
    </section>
  )
}
