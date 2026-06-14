import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { NumericKeypad } from './NumericKeypad'
import { Spinner } from '../ui/Spinner'

interface GerentePinModalProps {
  open: boolean
  tenantId: string
  onAuthorized: () => void
  onClose: () => void
}

interface UsuarioItem {
  id: string
  nombre: string
  rol: string
}

export function GerentePinModal({ open, tenantId, onAuthorized, onClose }: GerentePinModalProps) {
  const [step, setStep] = useState<'select' | 'pin'>('select')
  const [selectedId, setSelectedId] = useState('')
  const [selectedNombre, setSelectedNombre] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const prevOpen = useRef(false)

  const { data: usuarios, isError } = useQuery({
    queryKey: ['usuarios-pin'],
    queryFn: () =>
      api.get<{ ok: boolean; data: { usuarios: UsuarioItem[] } }>('/usuarios/pin-list')
        .then(r => r.data.data.usuarios),
    enabled: open,
  })

  useEffect(() => {
    if (open && !prevOpen.current) {
      setStep('select')
      setSelectedNombre('')
      setSelectedId('')
      setPin('')
      setError('')
    }
    prevOpen.current = open
  }, [open])

  if (!open) return null

  const handleSelect = (id: string, nombre: string) => {
    setSelectedId(id)
    setSelectedNombre(nombre)
    setStep('pin')
    setPin('')
    setError('')
  }

  const handleSubmit = async () => {
    if (pin.length < 4) return
    setError('')
    try {
      await api.post('/auth/login-pin', { usuario_id: selectedId, pin }, { headers: { 'X-Tenant-Id': tenantId } })
      onAuthorized()
    } catch {
      setError('PIN incorrecto')
    }
  }

  const gerentes = (usuarios ?? []).filter((u) => u.rol === 'administrador' || u.rol === 'gerente')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-text-secondary hover:text-text-primary cursor-pointer text-lg">✕</button>

        {step === 'select' ? (
          <div>
            <h3 className="font-display text-lg text-text-primary mb-4">Autorización de Gerente</h3>
            <p className="text-xs text-text-secondary mb-4 font-body">Selecciona tu nombre</p>
            {isError ? (
              <p className="text-sm text-danger text-center font-body py-4">Error al cargar usuarios</p>
            ) : !usuarios ? (
              <div className="flex justify-center py-8"><Spinner size="md" /></div>
            ) : gerentes.length === 0 ? (
              <p className="text-sm text-danger text-center font-body py-4">No hay gerentes disponibles</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {gerentes.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u.id, u.nombre)}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 border-border text-sm text-text-primary font-body hover:border-accent hover:bg-accent/5 transition-all cursor-pointer"
                  >
                    {u.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="font-display text-lg text-text-primary mb-1">Autorización de Gerente</h3>
            <p className="text-sm text-text-secondary font-body mb-4">{selectedNombre}</p>

            <div className="text-center mb-4">
              <span className="text-3xl font-mono tracking-[0.3em] text-accent">
                {pin.padEnd(6, '•')}
              </span>
            </div>

            {error && <p className="text-xs text-danger text-center mb-3">{error}</p>}

            <NumericKeypad
              onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))}
              onClear={() => setPin('')}
              onBackspace={() => setPin((p) => p.slice(0, -1))}
              onEnter={handleSubmit}
            />

            <button
              onClick={() => setStep('select')}
              className="w-full text-xs text-text-secondary hover:text-accent transition-colors cursor-pointer text-center mt-3"
            >
              ← Cambiar usuario
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
