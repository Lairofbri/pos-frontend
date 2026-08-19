export interface MetodoConfig {
  valor: string
  label: string
  icono?: string
  tipo: 'efectivo' | 'tarjeta' | 'transferencia' | 'bitcoin' | 'monedero' | 'cheque' | 'otro'
  necesitaMonto?: boolean
  necesitaReferencia?: boolean
  necesitaBanco?: boolean
  necesitaHash?: boolean
  necesitaWallet?: boolean
  necesitaDescripcion?: boolean
  permiteCambio?: boolean
}

export const METODOS_CONFIG: Record<string, MetodoConfig> = {
  efectivo: {
    valor: 'efectivo', label: 'Efectivo', tipo: 'efectivo',
  },
  tarjeta: {
    valor: 'tarjeta', label: 'Tarjeta', tipo: 'tarjeta',
  },
  tarjeta_debito: {
    valor: 'tarjeta_debito', label: 'T. Débito', tipo: 'tarjeta',
  },
  tarjeta_credito: {
    valor: 'tarjeta_credito', label: 'T. Crédito', tipo: 'tarjeta',
  },
  transferencia: {
    valor: 'transferencia', label: 'Transferencia', tipo: 'transferencia',
  },
  bitcoin: {
    valor: 'bitcoin', label: 'Bitcoin', tipo: 'bitcoin',
  },
  monedero_electronico: {
    valor: 'monedero_electronico', label: 'Monedero', tipo: 'monedero',
  },
  cheque: {
    valor: 'cheque', label: 'Cheque', tipo: 'cheque',
  },
  tarjeta_empresarial: {
    valor: 'tarjeta_empresarial', label: 'T. Empresarial', tipo: 'tarjeta',
  },
  bonos: {
    valor: 'bonos', label: 'Bonos', tipo: 'otro',
  },
  vales: {
    valor: 'vales', label: 'Vales', tipo: 'otro',
  },
  otro: {
    valor: 'otro', label: 'Otro', tipo: 'otro',
  },
}
