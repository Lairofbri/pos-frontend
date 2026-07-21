export interface MetodoConfig {
  valor: string
  icono: string
  label: string
  tipo: 'efectivo' | 'tarjeta' | 'transferencia' | 'bitcoin' | 'monedero' | 'cheque' | 'otro'
  necesitaMonto: boolean
  necesitaReferencia?: boolean
  necesitaBanco?: boolean
  necesitaHash?: boolean
  necesitaWallet?: boolean
  necesitaDescripcion?: boolean
  permiteCambio?: boolean
}

export const METODOS_CONFIG: Record<string, MetodoConfig> = {
  efectivo: {
    valor: 'efectivo', icono: '💵', label: 'Efectivo',
    tipo: 'efectivo', necesitaMonto: true, permiteCambio: true,
  },
  tarjeta: {
    valor: 'tarjeta', icono: '💳', label: 'Tarjeta',
    tipo: 'tarjeta', necesitaMonto: true, necesitaReferencia: true,
  },
  tarjeta_debito: {
    valor: 'tarjeta_debito', icono: '💳', label: 'Tarjeta Débito',
    tipo: 'tarjeta', necesitaMonto: true, necesitaReferencia: true,
  },
  tarjeta_credito: {
    valor: 'tarjeta_credito', icono: '💳', label: 'Tarjeta Crédito',
    tipo: 'tarjeta', necesitaMonto: true, necesitaReferencia: true,
  },
  mixto: {
    valor: 'mixto', icono: '🔀', label: 'Mixto',
    tipo: 'otro', necesitaMonto: false, permiteCambio: true,
  },
  transferencia: {
    valor: 'transferencia', icono: '🏦', label: 'Transferencia',
    tipo: 'transferencia', necesitaMonto: true, necesitaReferencia: true, necesitaBanco: true,
  },
  bitcoin: {
    valor: 'bitcoin', icono: '₿', label: 'Bitcoin',
    tipo: 'bitcoin', necesitaMonto: true, necesitaHash: true, necesitaWallet: true,
  },
  monedero_electronico: {
    valor: 'monedero_electronico', icono: '📱', label: 'Monedero Elect.',
    tipo: 'monedero', necesitaMonto: true, necesitaWallet: true,
  },
  cheque: {
    valor: 'cheque', icono: '📄', label: 'Cheque',
    tipo: 'cheque', necesitaMonto: true, necesitaReferencia: true, necesitaBanco: true,
  },
  tarjeta_empresarial: {
    valor: 'tarjeta_empresarial', icono: '💼', label: 'T. Empresarial',
    tipo: 'tarjeta', necesitaMonto: true, necesitaReferencia: true,
  },
  bonos: {
    valor: 'bonos', icono: '🎟️', label: 'Bonos',
    tipo: 'otro', necesitaMonto: true,
  },
  vales: {
    valor: 'vales', icono: '🎫', label: 'Vales',
    tipo: 'otro', necesitaMonto: true,
  },
  otro: {
    valor: 'otro', icono: '🔄', label: 'Otro',
    tipo: 'otro', necesitaMonto: true, necesitaDescripcion: true,
  },
}

export const buildPaymentPayload = (
  metodo: string,
  campos: Record<string, string>,
): Record<string, unknown> => {
  const config = METODOS_CONFIG[metodo]
  if (!config) return { metodo }

  const payload: Record<string, unknown> = { metodo }

  switch (config.tipo) {
    case 'efectivo':
      payload.monto = parseFloat(campos.monto || '0')
      payload.monto_efectivo = parseFloat(campos.monto || '0')
      break
    case 'tarjeta':
      payload.monto_tarjeta = parseFloat(campos.monto || '0')
      if (campos.referencia) payload.referencia_tarjeta = campos.referencia
      break
    case 'transferencia':
      payload.monto_transferencia = parseFloat(campos.monto || '0')
      if (campos.referencia) payload.referencia_transferencia = campos.referencia
      if (campos.banco) payload.banco_emisor = campos.banco
      break
    case 'bitcoin':
      payload.monto_bitcoin = parseFloat(campos.monto || '0')
      if (campos.hash) payload.hash_bitcoin = campos.hash
      if (campos.wallet) payload.wallet_id = campos.wallet
      break
    case 'monedero':
      payload.monto_monedero = parseFloat(campos.monto || '0')
      if (campos.wallet) payload.wallet_id = campos.wallet
      break
    case 'cheque':
      payload.monto_cheque = parseFloat(campos.monto || '0')
      if (campos.referencia) payload.referencia_cheque = campos.referencia
      if (campos.banco) payload.banco_emisor = campos.banco
      break
    default:
      if (metodo === 'mixto') {
        payload.monto_efectivo = parseFloat(campos.monto_efectivo || '0')
        payload.monto_tarjeta = parseFloat(campos.monto_tarjeta || '0')
        if (campos.referencia) payload.referencia_tarjeta = campos.referencia
      } else {
        const key = `monto_${metodo}`
        payload[key] = parseFloat(campos.monto || '0')
        if (campos.descripcion) payload.descripcion_otro = campos.descripcion
      }
  }

  return payload
}
