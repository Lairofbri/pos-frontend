import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEmpresas, login, loginPin } from './api'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { NumericKeypad } from '../../components/shared/NumericKeypad'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setTenantId } = useAuthStore()

  const [mode, setMode] = useState<'login' | 'pin'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: empresas, isError: empresasError, refetch: refetchEmpresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
    retry: 2,
    staleTime: 300_000,
  })

  const [empresaId, setEmpresaId] = useState('')
  const defaultEmpresaId = empresas?.[0]?.id ?? ''
  const effectiveEmpresaId = empresaId || defaultEmpresaId
  const selectedEmpresa = empresas?.find((e) => e.id === effectiveEmpresaId)

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
    } catch {
      setError('Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  const handlePinSubmit = async () => {
    if (!effectiveEmpresaId) { setError('Selecciona una empresa'); return }
    if (pin.length < 4) { setError('PIN inválido'); return }
    setError('')
    setLoading(true)
    try {
      const res = await loginPin({ usuario_id: '', pin }, effectiveEmpresaId)
      setAuth(res.access_token, res.usuario)
      setTenantId(effectiveEmpresaId)
      navigate('/pos', { replace: true })
    } catch {
      setError('PIN incorrecto')
    } finally {
      setLoading(false)
    }
  }

  if (empresasError) {
    return (
      <div className="flex flex-col items-center gap-4 px-6">
        <span className="text-4xl">⚠️</span>
        <p className="text-danger text-sm font-body text-center">
          No se pudo conectar con el servidor
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetchEmpresas()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto px-6">
      <div className="flex flex-col items-center mb-10">
        {selectedEmpresa?.logo_url ? (
          <img
            src={selectedEmpresa.logo_url}
            alt={selectedEmpresa.nombre}
            className="h-16 w-auto mb-4 object-contain transition-all duration-300"
          />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-accent/20 border-2 border-accent flex items-center justify-center mb-4">
            <span className="font-display text-2xl text-accent">
              {selectedEmpresa?.nombre?.charAt(0) || 'A'}
            </span>
          </div>
        )}
        <h1 className="font-display text-3xl text-text-primary tracking-wider">
          {selectedEmpresa?.nombre || 'AMBER POS'}
        </h1>
      </div>

      {empresas && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Empresa
          </label>
          <select
            value={effectiveEmpresaId}
            onChange={(e) => { setEmpresaId(e.target.value); setError('') }}
            className="w-full bg-bg-surface border-2 border-border rounded-lg px-4 py-2.5 text-text-primary font-body text-sm outline-none transition-all duration-200 focus:border-accent cursor-pointer appearance-none"
          >
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>
      )}

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
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-[30px] text-text-secondary hover:text-accent transition-colors cursor-pointer text-sm"
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <p className="text-xs text-danger text-center">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Ingresar
          </Button>

          <button
            type="button"
            onClick={() => setMode('pin')}
            className="text-xs text-text-secondary hover:text-accent transition-colors cursor-pointer text-center"
          >
            Acceder con PIN
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <span className="text-4xl font-mono tracking-[0.5em] text-accent">
              {pin.padEnd(6, '•')}
            </span>
          </div>

          {error && (
            <p className="text-xs text-danger text-center">{error}</p>
          )}

          <NumericKeypad
            onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))}
            onClear={() => setPin('')}
            onBackspace={() => setPin((p) => p.slice(0, -1))}
            onEnter={handlePinSubmit}
          />

          <button
            onClick={() => { setMode('login'); setError('') }}
            className="text-xs text-text-secondary hover:text-accent transition-colors cursor-pointer text-center"
          >
            Volver al login
          </button>
        </div>
      )}
    </div>
  )
}
