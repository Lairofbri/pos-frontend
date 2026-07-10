import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../config/queries'
import { getEmpresas, login, loginPin, getPinUsers } from './api'
import type { PinUser } from './api'
import { useAuthStore } from '../../store/authStore'
import { NumericKeypad } from '../../components/shared/NumericKeypad'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setTenantId } = useAuthStore()

  const [mode, setMode] = useState<'login' | 'pin'>('login')
  const [pinStep, setPinStep] = useState<'select' | 'pin'>('select')
  const [selectedUser, setSelectedUser] = useState<PinUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: empresas, isError: empresasError, refetch: refetchEmpresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
    ...queryDefaults('empresas'),
  })

  const [empresaId, setEmpresaId] = useState('')
  const defaultEmpresaId = empresas?.[0]?.id ?? ''
  const effectiveEmpresaId = empresaId || defaultEmpresaId
  const selectedEmpresa = empresas?.find((e) => e.id === effectiveEmpresaId)

  const { data: pinUsers, isLoading: pinUsersLoading, isError: pinUsersError, error: pinUsersErrorObj } = useQuery({
    queryKey: ['pin-users', effectiveEmpresaId],
    queryFn: () => getPinUsers(effectiveEmpresaId),
    enabled: mode === 'pin' && !!effectiveEmpresaId,
    ...queryDefaults('pin-users'),
  })

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!effectiveEmpresaId) { setError('Selecciona una empresa'); return }
    setError('')
    setLoading(true)
    try {
      const res = await login({ email, password, tenant_id: effectiveEmpresaId })
      setAuth(res.access_token, res.usuario)
      setTenantId(effectiveEmpresaId)
      navigate('/pos', { replace: true })
    } catch { setError('Credenciales inválidas') }
    finally { setLoading(false) }
  }

  const handlePinSubmit = async () => {
    if (!effectiveEmpresaId || !selectedUser?.id) { setError('Selecciona un usuario'); return }
    if (pin.length < 4) { setError('PIN inválido'); return }
    setError('')
    setLoading(true)
    try {
      const res = await loginPin({ usuario_id: selectedUser.id, pin }, effectiveEmpresaId)
      setAuth(res.access_token, res.usuario)
      setTenantId(effectiveEmpresaId)
      navigate('/pos', { replace: true })
    } catch { setError('PIN incorrecto') }
    finally { setLoading(false) }
  }

  const switchToPin = () => {
    setMode('pin'); setPinStep('select'); setSelectedUser(null); setPin(''); setError('')
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
    <div className="min-h-svh flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #FAF6F1 0%, #F3E8D8 100%)',
    }}>
      <div className="login-glass-card rounded-2xl p-8 sm:p-10 w-full max-w-md" style={{ boxShadow: '0 12px 32px rgba(70,55,40,0.15)' }}>
        <div className="flex flex-col items-center mb-8">
          {selectedEmpresa?.logo_url ? (
            <img src={selectedEmpresa.logo_url} alt={selectedEmpresa.nombre} className="h-16 w-auto mb-4 object-contain" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-wood-light border-2 border-pos-accent/20 flex items-center justify-center mb-4">
              <span className="font-display text-2xl text-pos-accent">{selectedEmpresa?.nombre?.charAt(0) || 'A'}</span>
            </div>
          )}
          <h1 className="font-display text-2xl text-pos-text tracking-wider">{selectedEmpresa?.nombre || 'AMBER POS'}</h1>
        </div>

        {empresas && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Empresa</label>
            <select
              value={effectiveEmpresaId}
              onChange={(e) => { setEmpresaId(e.target.value); setError('') }}
              className="login-input w-full appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%238C8177\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demo.pos"
                required
                className="login-input w-full"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="login-input w-full pr-10"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-[30px] text-text-secondary hover:text-pos-accent transition-colors cursor-pointer text-sm" tabIndex={-1}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {error && <p className="text-xs text-danger text-center">{error}</p>}

            <button type="submit" disabled={loading} className="login-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Ingresar
            </button>

            <button type="button" onClick={switchToPin} className="text-xs text-text-secondary hover:text-pos-accent transition-colors cursor-pointer text-center">
              Acceder con PIN
            </button>
          </form>
        ) : pinStep === 'select' ? (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg text-pos-text text-center">Acceso con PIN</h2>

            {pinUsersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-wood-mid border-t-pos-accent rounded-full animate-spin" />
              </div>
            ) : pinUsersError ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <p className="text-sm text-danger text-center font-body">Error al cargar usuarios</p>
                <p className="text-xs text-text-secondary text-center">{pinUsersErrorObj?.message || 'Intenta nuevamente'}</p>
                <button onClick={() => refetchEmpresas()} className="text-xs text-pos-accent hover:text-pos-accent-hover cursor-pointer underline">
                  Reintentar
                </button>
              </div>
            ) : !pinUsers || pinUsers.length === 0 ? (
              <p className="text-sm text-danger text-center font-body py-4">No hay usuarios con PIN disponibles</p>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Usuario</label>
                <select
                  value={selectedUser?.id ?? ''}
                  onChange={(e) => {
                    const u = pinUsers.find((p) => p.id === e.target.value)
                    if (u) { setSelectedUser(u); setPinStep('pin'); setPin(''); setError('') }
                  }}
                  className="login-input w-full appearance-none cursor-pointer"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%238C8177\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="">Seleccionar usuario...</option>
                  {pinUsers.map((u) => <option key={u.id} value={u.id}>{u.nombre}{u.apellido ? ` ${u.apellido}` : ''} ({u.rol})</option>)}
                </select>
              </div>
            )}

            <button onClick={() => { setMode('login'); setError('') }} className="text-xs text-text-secondary hover:text-pos-accent transition-colors cursor-pointer text-center">
              Volver al login
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <p className="text-sm text-text-secondary font-body mb-1">{selectedUser?.nombre}</p>
              <span className="text-4xl font-mono tracking-[0.5em] text-pos-accent">{pin.padEnd(6, '•')}</span>
            </div>

            {error && <p className="text-xs text-danger text-center">{error}</p>}

            <NumericKeypad onDigit={(d) => setPin((p) => p.length < 6 ? p + d : p)} onClear={() => setPin('')} onBackspace={() => setPin((p) => p.slice(0, -1))} onEnter={handlePinSubmit} />

            <button onClick={() => { setPinStep('select'); setSelectedUser(null); setPin(''); setError('') }} className="text-xs text-text-secondary hover:text-pos-accent transition-colors cursor-pointer text-center">
              ← Cambiar usuario
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
