import { useState, useMemo, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { getEmpresas, login, loginPin } from './api'
import type { SucursalOption } from './api'
import { useAuthStore } from '../../store/authStore'
import { NumericKeypad } from '../../components/shared/NumericKeypad'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

// Estado de provisión de la empresa en el selector de login (2026-10-07):
// se alimenta del estado fiscal real devuelto por GET /api/empresas.
const PROVISION_LABEL: Record<string, string> = {
  provisioning: 'Provisionando',
  pending_fiscal_setup: 'Config. fiscal pendiente',
  active: 'Activa',
  blocked: 'Bloqueada',
  failed: 'Fallida',
}

const PROVISION_STYLE: Record<string, string> = {
  provisioning: 'bg-blue-50 text-blue-700 border-blue-200',
  pending_fiscal_setup: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
}

const FISCAL_LABEL: Record<string, string> = {
  ready: 'Listo',
  pending_link: 'Sin vínculo',
  pending_mh_data: 'Datos MH pendientes',
  inactive: 'Inactiva',
  blocked: 'Bloqueada',
}

const FISCAL_STYLE: Record<string, string> = {
  ready: 'bg-green-50 text-green-700 border-green-200',
  pending_link: 'bg-sky-50 text-sky-700 border-sky-200',
  pending_mh_data: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-gray-50 text-gray-600 border-gray-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
}

const FiscalBadge = ({ estado }: { estado: string | null }) => {
  if (!estado) return null
  return (
    <span className={`mt-0.5 inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${FISCAL_STYLE[estado] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {FISCAL_LABEL[estado] ?? estado}
    </span>
  )
}

const nombreSesion = (empresa?: { nombre: string; nombre_comercial?: string | null } | null) =>
  empresa ? (empresa.nombre_comercial || empresa.nombre) : undefined

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setTenantId, setSucursalId } = useAuthStore()

  const [mode, setMode] = useState<'login' | 'pin'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, isError: empresasError, refetch: refetchEmpresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
    ...queryDefaults('empresas'),
  })

  const empresas = data?.tenants ?? []

  const [empresaId, setEmpresaId] = useState('')
  const defaultEmpresaId = empresas?.[0]?.id ?? ''
  const effectiveEmpresaId = empresaId || defaultEmpresaId
  const selectedEmpresa = empresas?.find((e) => e.id === effectiveEmpresaId)

  const sucursales = useMemo(() =>
    (data?.sucursales ?? []).filter((s: SucursalOption) => s.tenant_id === effectiveEmpresaId),
    [data?.sucursales, effectiveEmpresaId]
  )

  const [sucursalId, setLocalSucursalId] = useState('')
  const defaultSucursalId = sucursales.find((s: SucursalOption) => s.es_principal)?.id ?? sucursales[0]?.id ?? ''
  const effectiveSucursalId = sucursalId || defaultSucursalId

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!effectiveEmpresaId) { setError('Selecciona una empresa'); return }
    setError('')
    setLoading(true)
    try {
      const res = await login({ email, password, tenant_id: effectiveEmpresaId })
      setAuth(res.access_token, res.usuario)
      setTenantId(effectiveEmpresaId)
      if (effectiveSucursalId) setSucursalId(effectiveSucursalId)
      navigate('/pos', { replace: true })
    } catch { setError('Credenciales inválidas') }
    finally { setLoading(false) }
  }

  const handlePinSubmit = async () => {
    if (!effectiveEmpresaId) { setError('Selecciona una empresa'); return }
    if (pin.length < 4) { setError('PIN inválido'); return }
    setError('')
    setLoading(true)
    try {
      const res = await loginPin({ pin }, effectiveEmpresaId)
      setAuth(res.access_token, res.usuario)
      setTenantId(effectiveEmpresaId)
      if (effectiveSucursalId) setSucursalId(effectiveSucursalId)
      navigate('/pos', { replace: true })
    } catch { setError('PIN incorrecto') }
    finally { setLoading(false) }
  }

  const switchToPin = () => {
    setMode('pin'); setPin(''); setError('')
  }

  if (empresasError) {
    return (
      <div className="flex flex-col items-center gap-4 px-6">
        <span className="text-4xl">⚠️</span>
        <p className="text-danger text-sm font-body text-center">No se pudo conectar con el servidor</p>
        <button onClick={() => refetchEmpresas()} className="login-btn-primary">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-4 bg-gradient-to-br from-[#FAF6F1] to-[#F3E8D8]">
      <div className="login-glass-card rounded-2xl p-8 sm:p-10 w-full max-w-md shadow-[0_12px_32px_rgba(70,55,40,0.15)]">
        <div className="flex flex-col items-center mb-8">
          {selectedEmpresa?.logo_url ? (
            <img src={selectedEmpresa.logo_url} alt={nombreSesion(selectedEmpresa)} className="h-16 w-auto mb-4 object-contain" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-wood-light border-2 border-pos-accent/20 flex items-center justify-center mb-4">
              <span className="font-display text-2xl text-pos-accent">{nombreSesion(selectedEmpresa)?.charAt(0) || 'A'}</span>
            </div>
          )}
          <h1 className="font-display text-2xl text-pos-text tracking-wider">{nombreSesion(selectedEmpresa) || 'AMBER POS'}</h1>
          {selectedEmpresa?.fiscal_sync_status && empresas.length <= 1 ? (
            <span className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PROVISION_STYLE[selectedEmpresa.fiscal_sync_status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {PROVISION_LABEL[selectedEmpresa.fiscal_sync_status] ?? selectedEmpresa.fiscal_sync_status}
            </span>
          ) : null}
        </div>

        <div className="mb-5 flex flex-col gap-3">
          {empresas.length > 1 && (
            <div>
              <Select
                label="Empresa"
                value={effectiveEmpresaId}
                onValueChange={(v) => { setEmpresaId(v); setError('') }}
                options={empresas.map((e) => ({ value: e.id, label: nombreSesion(e) ?? e.nombre }))}
              />
              {selectedEmpresa?.fiscal_sync_status ? (
                <span className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PROVISION_STYLE[selectedEmpresa.fiscal_sync_status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {PROVISION_LABEL[selectedEmpresa.fiscal_sync_status] ?? selectedEmpresa.fiscal_sync_status}
                </span>
              ) : null}
              {selectedEmpresa?.nombre && selectedEmpresa.nombre !== nombreSesion(selectedEmpresa) ? (
                <span className="block text-[10px] text-text-secondary mt-0.5">
                  {selectedEmpresa.nombre}
                </span>
              ) : null}
            </div>
          )}

          {sucursales.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Sucursal</label>
              <div className="grid grid-cols-2 gap-2">
                {sucursales.map((s: SucursalOption) => (
                  <button
                    key={s.id}
                    onClick={() => { setLocalSucursalId(s.id); setError('') }}
                    className={`p-3 rounded-xl border-2 text-sm font-body transition-all duration-200 cursor-pointer text-left ${
                      effectiveSucursalId === s.id
                        ? 'border-accent bg-accent/10 text-accent shadow-sm'
                        : 'border-border text-text-secondary hover:border-accent/50 hover:bg-bg-surface'
                    }`}
                  >
                    <span className="block font-medium truncate">{s.nombre}</span>
                    <span className="flex items-center gap-1.5 mt-0.5">
                      {s.es_principal && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent/70">Principal</span>
                      )}
                      <FiscalBadge estado={s.fiscal_status} />
                    </span>
                    {s.fiscal_status && s.fiscal_status !== 'ready' && (
                      <span className="block text-[10px] text-text-secondary/80 mt-0.5">
                        No podrá emitir DTE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@demo.pos"
              required
            />
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-[30px] text-text-secondary hover:text-pos-accent transition-colors cursor-pointer" tabIndex={-1}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {error && <p className="text-xs text-danger text-center">{error}</p>}

            <button type="submit" disabled={loading} className="login-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Ingresar
            </button>

            <button type="button" onClick={switchToPin} className="text-xs text-text-secondary hover:text-pos-accent transition-colors cursor-pointer text-center">
              Acceder con PIN
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg text-pos-text text-center">Acceso con PIN</h2>

            <div className="text-center">
              <span className="text-4xl font-mono tracking-[0.5em] text-pos-accent">{'•'.repeat(pin.length)}</span>
            </div>

            {error && <p className="text-xs text-danger text-center">{error}</p>}

            <NumericKeypad onDigit={(d) => setPin((p) => p.length < 6 ? p + d : p)} onClear={() => setPin('')} onBackspace={() => setPin((p) => p.slice(0, -1))} onEnter={handlePinSubmit} />

            <button onClick={() => { setMode('login'); setPin(''); setError('') }} className="text-xs text-text-secondary hover:text-pos-accent transition-colors cursor-pointer text-center">
              ← Volver al login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}