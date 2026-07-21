import { useState, useMemo } from 'react'
import { SidePanel } from '../../../../components/shared/SidePanel'
import { Button } from '../../../../components/ui/Button'
import { useCatalogo } from '../../../../hooks/useCatalogo'
import type { Orden } from '../../../../types'
import { PaymentSummary } from './PaymentSummary'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { PaymentFields } from './PaymentFields'
import { ChangeDisplay } from './ChangeDisplay'
import { METODOS_CONFIG, buildPaymentPayload } from './metodos'

interface PaymentPanelProps {
  open: boolean
  onClose: () => void
  orden: Orden | null
  onConfirmar: (data: Record<string, unknown>) => void
  loading?: boolean
}

export function PaymentPanel({ open, onClose, orden, onConfirmar, loading }: PaymentPanelProps) {
  if (!orden) return null

  const [metodo, setMetodo] = useState('efectivo')
  const [campos, setCampos] = useState<Record<string, string>>({})
  const { data: metodosData } = useCatalogo('metodos_pago')

  const totalAPagar = orden.total + orden.propina_monto
  const config = METODOS_CONFIG[metodo]

  const totalPagado = useMemo(() => {
    if (metodo === 'mixto') {
      const ef = parseFloat(campos.monto_efectivo || '0')
      const tj = parseFloat(campos.monto_tarjeta || '0')
      return ef + tj
    }
    return parseFloat(campos.monto || '0')
  }, [metodo, campos])

  const cambio = (config?.permiteCambio ?? false)
    ? Math.max(0, totalPagado - totalAPagar)
    : 0

  const handleMetodoChange = (nuevo: string) => {
    setMetodo(nuevo)
    setCampos({})
  }

  const handleCampoChange = (campo: string, valor: string) => {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleConfirmar = () => {
    const payload = buildPaymentPayload(metodo, campos)
    onConfirmar(payload)
  }

  return (
    <SidePanel open={open} onClose={onClose} title="Pago">
      <div className="flex flex-col gap-5">
        <PaymentSummary
          totalAPagar={totalAPagar}
          propinaMonto={orden.propina_monto}
          propinaPorcentaje={orden.propina_porcentaje}
        />

        <PaymentMethodSelector
          metodos={metodosData ?? []}
          selected={metodo}
          onSelect={handleMetodoChange}
        />

        <PaymentFields
          metodo={metodo}
          campos={campos}
          onCampoChange={handleCampoChange}
          totalAPagar={totalAPagar}
        />

        <ChangeDisplay cambio={cambio} />

        <Button
          className="w-full"
          size="lg"
          loading={loading}
          onClick={handleConfirmar}
        >
          Confirmar Pago
        </Button>
      </div>
    </SidePanel>
  )
}
