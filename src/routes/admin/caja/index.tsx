import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCajaActiva, abrirCaja, cerrarCaja, registrarMovimiento, getHistorialCajas, getMovimientosCaja } from './api'
import { SidePanel } from '../../../components/shared/SidePanel'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Spinner } from '../../../components/ui/Spinner'
import { useToastStore } from '../../../store/toastStore'
import type { MovimientoCaja } from '../../../types'

type Tab = 'activa' | 'historial'

export default function CajaPage() {
  const queryClient = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [tab, setTab] = useState<Tab>('activa')
  const [abrirPanel, setAbrirPanel] = useState(false)
  const [cerrarPanel, setCerrarPanel] = useState(false)
  const [movimientoPanel, setMovimientoPanel] = useState(false)
  const [cajaHistorialId, setCajaHistorialId] = useState<string | null>(null)
  const [montoInicial, setMontoInicial] = useState('')
  const [montoFinal, setMontoFinal] = useState('')
  const [notasCierre, setNotasCierre] = useState('')
  const [movTipo, setMovTipo] = useState<'retiro' | 'deposito'>('retiro')
  const [movMonto, setMovMonto] = useState('')
  const [movMotivo, setMovMotivo] = useState('')

  const { data: cajaActiva, isLoading: loadingActiva } = useQuery({
    queryKey: ['caja-activa'],
    queryFn: getCajaActiva,
    refetchInterval: 30_000,
  })

  const { data: historial } = useQuery({
    queryKey: ['caja-historial'],
    queryFn: getHistorialCajas,
    staleTime: 60_000,
  })

  const { data: movimientos } = useQuery({
    queryKey: ['caja-movimientos', cajaHistorialId],
    queryFn: () => getMovimientosCaja(cajaHistorialId!),
    enabled: !!cajaHistorialId,
  })

  const abrirMutation = useMutation({
    mutationFn: () => abrirCaja({ monto_inicial: parseFloat(montoInicial || '0') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['caja-activa'] }); queryClient.invalidateQueries({ queryKey: ['caja-historial'] }); setAbrirPanel(false); setMontoInicial(''); showToast({ type: 'success', message: 'Caja abierta' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al abrir caja', description: err.message }),
  })

  const cerrarMutation = useMutation({
    mutationFn: () => cerrarCaja({ monto_final: parseFloat(montoFinal || '0'), notas_cierre: notasCierre || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['caja-activa'] }); queryClient.invalidateQueries({ queryKey: ['caja-historial'] }); setCerrarPanel(false); setMontoFinal(''); setNotasCierre(''); showToast({ type: 'success', message: 'Caja cerrada' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al cerrar caja', description: err.message }),
  })

  const movimientoMutation = useMutation({
    mutationFn: () => registrarMovimiento({ tipo: movTipo, monto: parseFloat(movMonto || '0'), motivo: movMotivo }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['caja-activa'] }); queryClient.invalidateQueries({ queryKey: ['caja-movimientos', cajaHistorialId] }); setMovimientoPanel(false); setMovMonto(''); setMovMotivo(''); showToast({ type: 'success', message: 'Movimiento registrado' }) },
    onError: (err: Error) => showToast({ type: 'error', message: 'Error al registrar movimiento', description: err.message }),
  })

  return (
    <div className="px-4 pb-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('activa')}
          className={`px-4 py-2 rounded-lg border-2 text-sm font-body font-semibold transition-all cursor-pointer ${tab === 'activa' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/50'}`}
        >
          Caja activa
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`px-4 py-2 rounded-lg border-2 text-sm font-body font-semibold transition-all cursor-pointer ${tab === 'historial' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/50'}`}
        >
          Historial
        </button>
      </div>

      {tab === 'activa' ? (
        loadingActiva ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : cajaActiva?.abierta ? (
          <div className="space-y-4">
            <div className="bg-bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-text-primary">Caja abierta</h2>
                <Badge variant="success">Abierta</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-text-secondary font-body">Inicial</p>
                  <p className="font-mono text-lg text-text-primary">${cajaActiva.monto_inicial.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-body">Actual</p>
                  <p className="font-mono text-lg text-accent font-bold">${cajaActiva.monto_actual.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-body">Abierta por</p>
                  <p className="text-sm text-text-primary font-body">{cajaActiva.abierta_por}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="secondary" className="flex-1" onClick={() => { setMovTipo('retiro'); setMovMonto(''); setMovMotivo(''); setMovimientoPanel(true) }}>
                  Retiro
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => { setMovTipo('deposito'); setMovMonto(''); setMovMotivo(''); setMovimientoPanel(true) }}>
                  Depósito
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => { setMontoFinal(cajaActiva.monto_actual.toString()); setNotasCierre(''); setCerrarPanel(true) }}>
                  Cerrar caja
                </Button>
              </div>
            </div>

            <div className="bg-bg-surface rounded-xl border border-border p-5">
              <h3 className="font-display text-base text-text-primary mb-3">Últimos movimientos</h3>
              {cajaHistorialId && movimientos ? (
                <MovimientosList movimientos={movimientos} />
              ) : (
                <button
                  onClick={() => setCajaHistorialId(cajaActiva.id)}
                  className="text-sm text-accent hover:underline cursor-pointer"
                >
                  Ver movimientos
                </button>
              )}
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
              <button
                key={caja.id}
                onClick={() => setCajaHistorialId(caja.id)}
                className="w-full bg-bg-surface rounded-xl border border-border p-4 text-left hover:border-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={caja.abierta ? 'success' : 'default'}>{caja.abierta ? 'Abierta' : 'Cerrada'}</Badge>
                  <span className="text-xs text-text-secondary font-mono">{new Date(caja.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-text-primary font-body">{caja.abierta_por}</span>
                  <span className="font-mono text-accent">${caja.monto_actual.toFixed(2)}</span>
                  {caja.closed_at && <span className="text-text-secondary font-mono">{new Date(caja.closed_at).toLocaleDateString()}</span>}
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
          <Input label="Monto final (contado)" type="number" step="0.01" value={montoFinal} onChange={(e) => setMontoFinal(e.target.value)} placeholder="0.00" />
          <Input label="Notas (opcional)" value={notasCierre} onChange={(e) => setNotasCierre(e.target.value)} placeholder="Observaciones..." />
          <Button className="w-full" onClick={() => cerrarMutation.mutate()} loading={cerrarMutation.isPending} disabled={!montoFinal}>Cerrar caja</Button>
        </div>
      </SidePanel>

      <SidePanel open={movimientoPanel} onClose={() => setMovimientoPanel(false)} title={movTipo === 'retiro' ? 'Retiro' : 'Depósito'}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button onClick={() => setMovTipo('retiro')} className={`flex-1 py-2 rounded-lg border-2 text-sm font-body font-semibold cursor-pointer transition-all ${movTipo === 'retiro' ? 'border-danger bg-danger/10 text-danger' : 'border-border text-text-secondary'}`}>Retiro</button>
            <button onClick={() => setMovTipo('deposito')} className={`flex-1 py-2 rounded-lg border-2 text-sm font-body font-semibold cursor-pointer transition-all ${movTipo === 'deposito' ? 'border-success bg-success/10 text-success' : 'border-border text-text-secondary'}`}>Depósito</button>
          </div>
          <Input label="Monto" type="number" step="0.01" value={movMonto} onChange={(e) => setMovMonto(e.target.value)} placeholder="0.00" />
          <Input label="Motivo" value={movMotivo} onChange={(e) => setMovMotivo(e.target.value)} placeholder="¿Para qué?" />
          <Button className="w-full" onClick={() => movimientoMutation.mutate()} loading={movimientoMutation.isPending} disabled={!movMonto || !movMotivo}>
            {movTipo === 'retiro' ? 'Registrar retiro' : 'Registrar depósito'}
          </Button>
        </div>
      </SidePanel>
    </div>
  )
}

function MovimientosList({ movimientos }: { movimientos: MovimientoCaja[] }) {
  const iconos: Record<string, string> = { apertura: '🔓', cierre: '🔒', ingreso: '📥', egreso: '📤' }
  return (
    <div className="divide-y divide-border/50">
      {movimientos.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-4 font-body">Sin movimientos</p>
      ) : (
        movimientos.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span>{iconos[m.tipo] || '•'}</span>
              <div>
                <p className="text-sm text-text-primary font-body">{m.motivo}</p>
                <p className="text-xs text-text-secondary font-mono">{m.usuario} · {new Date(m.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
            <span className={`font-mono text-sm ${m.tipo === 'ingreso' || m.tipo === 'apertura' ? 'text-success' : 'text-danger'}`}>
              {m.tipo === 'ingreso' || m.tipo === 'apertura' ? '+' : '-'}${m.monto.toFixed(2)}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
