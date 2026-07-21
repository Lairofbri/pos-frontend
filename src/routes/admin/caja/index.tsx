import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { abrirCaja, cerrarCaja, registrarMovimiento, getHistorialCajas, getResumenDiario, obtenerCuadre } from './api'
import { useCajaActiva } from '../../../hooks/useCajaActiva'
import { SidePanel } from '../../../components/shared/SidePanel'
import { InlineError } from '../../../components/shared/InlineError'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Spinner } from '../../../components/ui/Spinner'
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

  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['resumen-diario'],
    queryFn: () => getResumenDiario(),
    enabled: cerrarPanel,
    ...queryDefaults('resumen-diario'),
  })

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

  const totalIngresos = useMemo(() => {
    if (!resumen) return 0
    return parseFloat(resumen.total_ingresos || '0')
  }, [resumen])

  const montoContado = parseFloat(montoFinal || '0')
  const diferencia = totalIngresos > 0 ? montoContado - totalIngresos : 0
  const hayDiferencia = Math.abs(diferencia) > 0.01

  const abrirMutation = useMutation({
    mutationFn: () => abrirCaja({ monto_inicial: parseFloat(montoInicial || '0') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['caja-activa'] }); queryClient.invalidateQueries({ queryKey: ['caja-historial'] }); setAbrirPanel(false); setMontoInicial(''); showToast({ type: 'success', message: 'Caja abierta' }) },
  })

  const cerrarMutation = useMutation({
    mutationFn: () => cerrarCaja({ monto_final: parseFloat(montoFinal || '0'), notas_cierre: notasCierre || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['caja-activa'] }); queryClient.invalidateQueries({ queryKey: ['caja-historial'] }); setCerrarPanel(false); setMontoFinal(''); setNotasCierre(''); showToast({ type: 'success', message: 'Caja cerrada' }) },
  })

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
          <div className="space-y-4">
            <div className="bg-bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-text-primary">Caja abierta</h2>
                <Badge variant="success">Abierta</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-text-secondary font-body">Inicial</p>
                  <p className="font-mono text-lg text-text-primary">${cajaActiva.monto_inicial.toFixed(2)}</p>
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
            <span className="text-5xl">💰</span>
            <h2 className="font-display text-lg text-text-primary">No hay caja abierta</h2>
            <p className="text-text-secondary text-sm font-body">Abre una caja para comenzar a operar</p>
            <Button onClick={() => { setMontoInicial(''); setAbrirPanel(true) }}>Abrir caja</Button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {(historial ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-4xl">📋</span>
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

      <SidePanel open={cerrarPanel} onClose={() => setCerrarPanel(false)} title="Cerrar caja">
        <div className="flex flex-col gap-4">
          {loadingResumen ? (
            <div className="flex justify-center py-8"><Spinner size="md" /></div>
          ) : resumen ? (
            <div className="bg-bg-primary rounded-xl border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Resumen del día</p>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-body">Total órdenes</span>
                <span className="font-mono text-text-primary">{resumen.total_ordenes}</span>
              </div>
              <div className="border-t border-border/50 pt-2 space-y-1">
                {resumen.metodos.map((m) => (
                  <div key={m.metodo} className="flex justify-between text-sm">
                    <span className="text-text-secondary font-body capitalize">{m.metodo} ({m.cantidad_ordenes})</span>
                    <span className="font-mono text-text-primary">${parseFloat(m.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                <span className="text-text-primary font-body">Total esperado</span>
                <span className="font-mono text-accent">${totalIngresos.toFixed(2)}</span>
              </div>
            </div>
          ) : null}

          <Input label="Monto contado" type="text" inputMode="decimal" value={montoFinal} onChange={(e) => setMontoFinal(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" />

          {hayDiferencia && (
            <div className={`rounded-xl border-2 px-4 py-3 text-center ${diferencia < 0 ? 'bg-danger/10 border-danger/30' : 'bg-accent/10 border-accent/30'}`}>
              <p className={`text-sm font-body font-semibold ${diferencia < 0 ? 'text-danger' : 'text-accent'}`}>
                {diferencia < 0 ? `⚠️ Faltan $${Math.abs(diferencia).toFixed(2)}` : `⚠️ Sobran $${diferencia.toFixed(2)}`}
              </p>
            </div>
          )}

          <Input label="Notas (opcional)" value={notasCierre} onChange={(e) => setNotasCierre(e.target.value)} placeholder="Observaciones..." />

          <Button className="w-full" onClick={() => cerrarMutation.mutate()} loading={cerrarMutation.isPending} disabled={!montoFinal}>
            {hayDiferencia ? 'Cerrar con diferencia' : 'Cerrar caja'}
          </Button>
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

            <div className="bg-bg-primary rounded-xl border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-body">Inicial</span>
                <span className="font-mono text-text-primary">${cajaDetalle.monto_inicial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-body">Total ventas</span>
                <span className="font-mono text-accent font-bold">${cajaDetalle.total_ventas.toFixed(2)}</span>
              </div>

              {(cajaDetalle.metodos ?? []).length > 0 && (
                <div className="border-t border-border/50 pt-2 space-y-1">
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

              <div className="border-t border-border/50 pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-body">Retiros</span>
                  <span className="font-mono text-text-primary">${cajaDetalle.total_retiros.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-body">Depósitos</span>
                  <span className="font-mono text-text-primary">${cajaDetalle.total_depositos.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border pt-2 space-y-1">
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
