import { Input } from '@/components/ui/Input'
import { METODOS_CONFIG } from './metodos'

interface PaymentFieldsProps {
  metodo: string
  campos: Record<string, string>
  onCampoChange: (campo: string, valor: string) => void
  totalAPagar?: number
}

function InputField({ label, value, onChange, placeholder, inputMode, readOnly, maxLength, mono }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'text' | 'decimal'
  readOnly?: boolean
  maxLength?: number
  mono?: boolean
}) {
  return (
    <Input
      label={label}
      type="text"
      inputMode={inputMode ?? 'text'}
      value={value}
      onChange={(e) => {
        if (inputMode === 'decimal') {
          onChange(e.target.value.replace(/[^0-9.]/g, ''))
        } else {
          onChange(e.target.value)
        }
      }}
      placeholder={placeholder}
      readOnly={readOnly}
      maxLength={maxLength}
      className={mono ? 'font-mono text-lg' : ''}
    />
  )
}

export function PaymentFields({ metodo, campos, onCampoChange }: PaymentFieldsProps) {
  const config = METODOS_CONFIG[metodo]
  if (!config) return null

  const handleChange = (campo: string) => (valor: string) => onCampoChange(campo, valor)

  if (metodo === 'mixto') {
    return (
      <div className="flex flex-col gap-3">
        <InputField
          label="Monto en efectivo"
          value={campos.monto_efectivo ?? ''}
          onChange={handleChange('monto_efectivo')}
          placeholder="0.00"
          inputMode="decimal"
          mono
        />
        <InputField
          label="Monto en tarjeta"
          value={campos.monto_tarjeta ?? ''}
          onChange={handleChange('monto_tarjeta')}
          placeholder="0.00"
          inputMode="decimal"
          mono
        />
        <InputField
          label="Referencia (opcional)"
          value={campos.referencia ?? ''}
          onChange={handleChange('referencia')}
          placeholder="Últimos 4 dígitos"
          maxLength={20}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 animate-fadeIn">
      <InputField
        label="Monto"
        value={campos.monto ?? ''}
        onChange={handleChange('monto')}
        placeholder="0.00"
        inputMode="decimal"
        mono
      />

      {config.necesitaBanco && (
        <InputField
          label="Banco emisor"
          value={campos.banco ?? ''}
          onChange={handleChange('banco')}
          placeholder="Nombre del banco"
          maxLength={100}
        />
      )}

      {config.necesitaReferencia && (
        <InputField
          label={metodo === 'cheque' ? 'Número de cheque' : 'Referencia'}
          value={campos.referencia ?? ''}
          onChange={handleChange('referencia')}
          placeholder={metodo === 'cheque' ? 'N° de cheque' : 'Referencia'}
          maxLength={metodo === 'cheque' ? 50 : 100}
        />
      )}

      {config.necesitaWallet && metodo === 'bitcoin' && (
        <InputField
          label="Wallet ID"
          value={campos.wallet ?? ''}
          onChange={handleChange('wallet')}
          placeholder="Dirección de bitcoin"
          maxLength={100}
        />
      )}

      {config.necesitaWallet && metodo === 'monedero_electronico' && (
        <InputField
          label="ID Monedero"
          value={campos.wallet ?? ''}
          onChange={handleChange('wallet')}
          placeholder="ID del monedero"
          maxLength={50}
        />
      )}

      {config.necesitaHash && (
        <InputField
          label="Hash de transacción"
          value={campos.hash ?? ''}
          onChange={handleChange('hash')}
          placeholder="Hash de la transacción"
          maxLength={100}
        />
      )}

      {config.necesitaDescripcion && (
        <InputField
          label="Descripción"
          value={campos.descripcion ?? ''}
          onChange={handleChange('descripcion')}
          placeholder="Describa el método de pago"
          maxLength={255}
        />
      )}
    </div>
  )
}
