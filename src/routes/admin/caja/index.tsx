import { useState } from 'react'
import { DollarSign, ClipboardList, CircleCheck, TriangleAlert, HandCoins } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { abrirCaja, cerrarCaja, registrarMovimiento, getHistorialCajas, verificarCuadre, obtenerCuadre } from './api'
import { useCajaActiva } from '../../../hooks/useCajaActiva'
import { SidePanel } from '../../../components/shared/SidePanel'
import { InlineError } from '../../../components/shared/InlineError'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useToastStore } from '../../../store/toastStore'
import { useCatalogo } from '../../../hooks/useCatalogo'
import type { CajaTurno, CajaCuadre } from '../../../types'

type Tab = 'activa' | 'historial'

export default function CajaPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const { caja: cajaActiva, isLoading: loadingActiva, isError: cajaError, mensajeError: cajaMensaje, refetch: cajaRefetch } = useCajaActiva()
  const { data: movTipos } = useCatalogo('movimientos_tipo')
  const [tab, setTab] = useState<Tab>('activa')
  const [abrirPanel, setAbrirPanel] = useState(false)
  const [cerrarPanel, setCerrarPanel] = useState(false)
  const [movimientoPanel, setMovimientoPanel] = useState(false)
  const [cajaDetalleId, setCajaDetalleId] = useState<string | null>(null)
  const [montoInicial, setMontoInicial] = useState('')
  const [montoFinal, setMontoFinal] = useState('')
  const [notasCierre, setNotasCierre] = useState('')
  const [movTipo, setMovTipo] = useState<'retiro' | 'deposito'>('retiro')
  const [movMonto, setMovMonto] = useState('')
  const [movMotivo, setMovMotivo] = useState('')
  const [cuadreResult, setCuadreResult] = useState<{ cuadra: boolean; mensaje: string; diferencia: number; total_esperado: number } | null>(null)
  const [verificando, setVerificando] = useState(false)

  const { data: historial } = useQuery<CajaTurno[]>({
    queryKey: ['caja-historial'],
    queryFn: getHistorialCajas,
    ...queryDefaults('caja-historial'),
  })

  const { data: cajaDetalle } = useQuery<CajaCuadre>({
    queryKey: ['caja-cuadre', cajaDetalleId],
    queryFn: () => obtenerCuadre(cajaDetalleId!),
    enabled: !!cajaDetalleId,
    ...queryDefaults('caja-movimientos'),
  })

  const abrirMutation = useMutation({
    mutationFn: () => abrirCaja({ monto_inicial: parseFloat(montoInicial || '0') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['caja-activa'] }); queryClient.invalidateQueries({ queryKey: ['caja-historial'] }); setAbrirPanel(false); setMontoInicial(''); showToast({ type: 'success', message: 'Caja abierta' }) },
  })

  const cerrarMutation = useMutation({
    mutationFn: () => cerrarCaja({ monto_final: parseFloat(montoFinal || '0'), notas_cierre: notasCierre || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['caja-activa'] }); queryClient.invalidateQueries({ queryKey: ['caja-historial'] }); setCerrarPanel(false); setMontoFinal(''); setNotasCierre(''); setCuadreResult(null); showToast({ type: 'success', message: 'Caja cerrada' }) },
  })

  const handleVerificarCuadre = async () => {
    const monto = parseFloat(montoFinal || '0')
    if (!monto || monto <= 0) return
    setVerificando(true)
    try {
      const res = await verificarCuadre(monto)
      setCuadreResult(res)
    } catch {
      showToast({ type: 'error', message: 'Error al verificar cuadre' })
    } finally {
      setVerificando(false)
    }
  }

  const handleRecontar = () => {
    setCuadreResult(null)
    setMontoFinal('')
    setNotasCierre('')
  }

  const movimientoMutation = useMutation({
    mutationFn: () => registrarMovimiento({ tipo: movTipo, monto: parseFloat(movMonto || '0'), motivo: movMotivo }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['caja-activa'] }); setMovimientoPanel(false); setMovMonto(''); setMovMotivo(''); showToast({ type: 'success', message: 'Movimiento registrado' }) },
  })

  return (
    <div className="px-4 pb-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('activa')} className={`px-4 py-2 rounded-lg border-2 text-sm font-body font-semibold transition-all cursor-pointer ${tab === 'activa' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/50'}`}>Caja activa</button>
        <button onClick={() => setTab('historial')} className={`px-4 py-2 rounded-lg border-2 text-sm font-body font-semibold transition-all cursor-pointer ${tab === 'historial' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/50'}`}>Historial</button>
      </div>

      {tab === 'activa' ? (
        loadingActiva ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : cajaError ? (
          <InlineError message={cajaMensaje ?? 'Error al consultar caja'} onRetry={() => cajaRefetch()} />
        ) : cajaActiva?.estado === 'abierta' ? (
          <div className="flex flex-col gap-4">
            <div className="bg-bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-text-primary">Caja abierta</h2>
                <Badge variant="success">Abierta</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-text-secondary font-body">Inicial</p>
                  <p className="font-mono text-lg text-text-primary">${(cajaActiva.monto_inicial ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-body">Abierta por</p>
                  <p className="text-sm text-text-primary font-body">{cajaActiva.usuario_apertura}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="secondary" className="flex-1" onClick={() => { setMovTipo('retiro'); setMovMonto(''); setMovMotivo(''); setMovimientoPanel(true) }}>Retiro</Button>
                <Button variant="secondary" className="flex-1" onClick={() => { setMovTipo('deposito'); setMovMonto(''); setMovMotivo(''); setMovimientoPanel(true) }}>Depósito</Button>
                <Button variant="danger" className="flex-1" onClick={() => { setCerrarPanel(true) }}>Cerrar caja</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <DollarSign className="size-12 text-pos-accent/60" />
            <h2 className="font-display text-lg text-text-primary">No hay caja abierta</h2>
            <p className="text-text-secondary text-sm font-body">Abre una caja para comenzar a operar</p>
            <Button onClick={() => { setMontoInicial(''); setAbrirPanel(true) }}>Abrir caja</Button>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {(historial ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ClipboardList className="size-10 text-text-secondary" />
              <p className="text-text-secondary text-sm font-body">Sin historial</p>
            </div>
          ) : (
            historial?.map((caja) => (
              <button key={caja.id} onClick={() => setCajaDetalleId(caja.id)} className="w-full bg-bg-surface rounded-xl border border-border p-4 text-left hover:border-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={caja.estado === 'abierta' ? 'success' : 'default'}>{caja.estado === 'abierta' ? 'Abierta' : 'Cerrada'}</Badge>
                  <span className="text-xs text-text-secondary font-mono">{new Date(caja.fecha_apertura).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-text-primary font-body">{caja.usuario_apertura}</span>
                  {caja.fecha_cierre && <span className="text-text-secondary font-mono">{new Date(caja.fecha_cierre).toLocaleDateString()}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <SidePanel open={abrirPanel} onClose={() => setAbrirPanel(false)} title="Abrir caja">
        <div className="flex flex-col gap-4">
          <Input label="Monto inicial" type="number" step="0.01" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} placeholder="0.00" />
          <Button className="w-full" onClick={() => abrirMutation.mutate()} loading={abrirMutation.isPending} disabled={!montoInicial}>Abrir caja</Button>
        </div>
      </SidePanel>

      <SidePanel
        open={cerrarPanel}
        onClose={() => { setCerrarPanel(false); setCuadreResult(null); setMontoFinal(''); setNotasCierre('') }}
        title="Cerrar caja"
      >
        <div className="flex flex-col gap-4">
          {!cuadreResult ? (
            <>
              <div className="bg-bg-primary rounded-xl border border-border p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <HandCoins className="size-4 text-pos-accent" aria-hidden />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Paso 1 — Contar efectivo
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Cuenta los billetes y monedas de la caja. No veas ningún total del sistema.
                  Los pagos con tarjeta y otros métodos están en los tickets impresos del POS.
                </p>
              </div>

              <Input
                label="Monto contado"
                type="text"
                inputMode="decimal"
                value={montoFinal}
                onChange={(e) => setMontoFinal(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
              />

              <Button
                className="w-full"
                onClick={handleVerificarCuadre}
                loading={verificando}
                disabled={!montoFinal || parseFloat(montoFinal) <= 0}
              >
                Verificar cuadre
              </Button>
            </>
          ) : (
            <>
              {cuadreResult.cuadra ? (
                <div className="bg-green-50 rounded-xl border-2 border-green-300 px-4 py-5 text-center flex flex-col items-center gap-2">
                  <CircleCheck className="size-10 text-green-600" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-green-800">Caja cuadrada</p>
                    <p className="text-xs text-green-600 mt-1">
                      El monto contado coincide con el esperado
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-center">
                      <p className="text-[10px] text-green-600 uppercase tracking-wider">Esperado</p>
                      <p className="text-sm font-mono font-bold text-green-800">${(cuadreResult.total_esperado ?? 0).toFixed(2)}</p>
                    </div>
                    <span className="text-green-400 text-lg">=</span>
                    <div className="text-center">
                      <p className="text-[10px] text-green-600 uppercase tracking-wider">Contado</p>
                      <p className="text-sm font-mono font-bold text-green-800">${parseFloat(montoFinal || '0').toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ) : cuadreResult.diferencia > 0 ? (
                <div className="bg-amber-50 rounded-xl border-2 border-amber-300 px-4 py-5 flex flex-col items-center gap-2">
                  <TriangleAlert className="size-10 text-amber-600" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Sobrante detectado</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Hay más dinero del esperado. Verifica tu conteo.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-center">
                      <p className="text-[10px] text-amber-600 uppercase tracking-wider">Esperado</p>
                      <p className="text-sm font-mono font-bold text-amber-800">${(cuadreResult.total_esperado ?? 0).toFixed(2)}</p>
                    </div>
                    <span className="text-amber-500 text-lg">&lt;</span>
                    <div className="text-center">
                      <p className="text-[10px] text-amber-600 uppercase tracking-wider">Contado</p>
                      <p className="text-sm font-mono font-bold text-amber-800">${parseFloat(montoFinal || '0').toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-amber-100 rounded-lg px-3 py-1.5 mt-1">
                    <p className="text-sm font-bold font-mono text-amber-700">
                      Sobran ${(cuadreResult.diferencia ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 rounded-xl border-2 border-red-300 px-4 py-5 flex flex-col items-center gap-2">
                  <TriangleAlert className="size-10 text-red-600" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-red-800">Faltante detectado</p>
                    <p className="text-xs text-red-600 mt-1">
                      Falta dinero. Revisa el conteo o solicita autorización.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-center">
                      <p className="text-[10px] text-red-600 uppercase tracking-wider">Esperado</p>
                      <p className="text-sm font-mono font-bold text-red-800">${(cuadreResult.total_esperado ?? 0).toFixed(2)}</p>
                    </div>
                    <span className="text-red-500 text-lg">&gt;</span>
                    <div className="text-center">
                      <p className="text-[10px] text-red-600 uppercase tracking-wider">Contado</p>
                      <p className="text-sm font-mono font-bold text-red-800">${parseFloat(montoFinal || '0').toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="bg-red-100 rounded-lg px-3 py-1.5 mt-1">
                    <p className="text-sm font-bold font-mono text-red-700">
                      Faltan ${Math.abs(cuadreResult.diferencia ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-1" />

              <Input
                label="Notas (opcional)"
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                placeholder="Observaciones del cierre..."
              />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleRecontar}
                >
                  Recontar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => cerrarMutation.mutate()}
                  loading={cerrarMutation.isPending}
                >
                  {cuadreResult.cuadra ? 'Cerrar caja' : 'Cerrar con diferencia'}
                </Button>
              </div>
            </>
          )}
        </div>
      </SidePanel>

      <SidePanel open={movimientoPanel} onClose={() => setMovimientoPanel(false)} title={(movTipos ?? []).find((t) => t.valor === movTipo)?.label ?? movTipo}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(movTipos ?? []).map((t) => (
              <button
                key={t.valor}
                onClick={() => setMovTipo(t.valor as 'retiro' | 'deposito')}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-body font-semibold cursor-pointer transition-all ${
                  movTipo === t.valor
                    ? t.valor === 'retiro' ? 'border-danger bg-danger/10 text-danger' : 'border-success bg-success/10 text-success'
                    : 'border-border text-text-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Input label="Monto" type="text" inputMode="decimal" value={movMonto} onChange={(e) => setMovMonto(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" />
          <Input label="Motivo" value={movMotivo} onChange={(e) => setMovMotivo(e.target.value)} placeholder="¿Para qué?" />
          <Button className="w-full" onClick={() => movimientoMutation.mutate()} loading={movimientoMutation.isPending} disabled={!movMonto || !movMotivo}>
            {movTipo === 'retiro' ? 'Registrar retiro' : 'Registrar depósito'}
          </Button>
        </div>
      </SidePanel>

      <SidePanel open={!!cajaDetalleId} onClose={() => setCajaDetalleId(null)} title="Detalle de caja">
        {cajaDetalle && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Badge variant={cajaDetalle.estado === 'abierta' ? 'success' : 'default'}>
                {cajaDetalle.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
              </Badge>
              <span className="text-xs text-text-secondary font-mono">
                {new Date(cajaDetalle.fecha_apertura).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-text-secondary font-body">Abierta por</p>
                <p className="text-text-primary font-body">{cajaDetalle.usuario_apertura}</p>
              </div>
              {cajaDetalle.usuario_cierre && (
                <div>
                  <p className="text-xs text-text-secondary font-body">Cerrada por</p>
                  <p className="text-text-primary font-body">{cajaDetalle.usuario_cierre}</p>
                </div>
              )}
            </div>

            <div className="bg-bg-primary rounded-xl border border-border p-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-body">Inicial</span>
                <span className="font-mono text-text-primary">${cajaDetalle.monto_inicial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-body">Total ventas</span>
                <span className="font-mono text-accent font-bold">${cajaDetalle.total_ventas.toFixed(2)}</span>
              </div>

              {(cajaDetalle.metodos ?? []).length > 0 && (
                  <div className="border-t border-border/50 pt-2 flex flex-col gap-1">
                    {cajaDetalle.metodos?.map((m) => (
                    <div key={m.metodo} className="flex justify-between text-sm pl-3">
                      <span className="text-text-secondary font-body capitalize">
                        {m.metodo} ({m.cantidad_ordenes})
                      </span>
                      <span className="font-mono text-text-primary">${m.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border/50 pt-2 flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-body">Retiros</span>
                  <span className="font-mono text-text-primary">${cajaDetalle.total_retiros.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-body">Depósitos</span>
                  <span className="font-mono text-text-primary">${cajaDetalle.total_depositos.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border pt-2 flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-body">Esperado</span>
                  <span className="font-mono text-text-primary">${cajaDetalle.total_esperado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-body">Contado</span>
                  <span className="font-mono text-text-primary">${cajaDetalle.monto_final?.toFixed(2) ?? '—'}</span>
                </div>
                {cajaDetalle.diferencia !== undefined && (
                  <div className={`flex justify-between text-sm font-semibold ${cajaDetalle.diferencia >= 0 ? 'text-success' : 'text-danger'}`}>
                    <span className="font-body">Diferencia</span>
                    <span className="font-mono">
                      {cajaDetalle.diferencia >= 0 ? '+' : ''}${cajaDetalle.diferencia.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {cajaDetalle.notas_cierre && (
              <div>
                <p className="text-xs text-text-secondary font-body mb-1">Notas cierre</p>
                <p className="text-sm text-text-primary bg-bg-primary rounded-lg p-3 border border-border">{cajaDetalle.notas_cierre}</p>
              </div>
            )}
          </div>
        )}
      </SidePanel>
    </div>
  )
}
