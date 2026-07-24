import { useState } from 'react'
import { NumericKeypad } from './NumericKeypad'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/client'

interface SwitchUserModalProps {
  open: boolean
  onClose: () => void
}

export function SwitchUserModal({ open, onClose }: SwitchUserModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const usuario = useAuthStore((s) => s.usuario)
  const tenantId = useAuthStore((s) => s.tenantId)
  const setAuth = useAuthStore((s) => s.setAuth)

  if (!open) return null

  const handleSubmit = async () => {
    if (pin.length < 4) return
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ data: { access_token: string; usuario: import('../../types').Usuario } }>(
        '/auth/login-pin',
        { pin },
        { headers: { 'X-Tenant-Id': tenantId } }
      ).then(r => r.data.data)
      setAuth(res.access_token, res.usuario)
      setPin('')
      onClose()
    } catch {
      setError('PIN incorrecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-text-secondary hover:text-text-primary cursor-pointer text-lg">✕</button>

        <h3 className="font-display text-lg text-text-primary mb-1">Cambiar usuario</h3>
        <p className="text-sm text-text-secondary font-body mb-4">
          {usuario?.nombre} ({usuario?.rol})
        </p>

        <div className="text-center mb-4">
          <span className="text-3xl font-mono tracking-[0.3em] text-pos-accent">
            {'•'.repeat(pin.length)}
          </span>
        </div>

        {error && <p className="text-xs text-danger text-center mb-3">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="size-6 border-2 border-wood-mid border-t-pos-accent rounded-full animate-spin" />
          </div>
        ) : (
          <NumericKeypad
            onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))}
            onClear={() => setPin('')}
            onBackspace={() => setPin((p) => p.slice(0, -1))}
            onEnter={handleSubmit}
          />
        )}
      </div>
    </div>
  )
}