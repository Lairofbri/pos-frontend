interface PaymentSummaryProps {
  totalAPagar: number
  propinaMonto: number
  propinaPorcentaje: number
}

export function PaymentSummary({ totalAPagar, propinaMonto, propinaPorcentaje }: PaymentSummaryProps) {
  return (
    <div className="text-center">
      <p className="text-xs text-text-secondary font-body uppercase tracking-wider">Total a pagar</p>
      <p className="text-3xl font-mono text-accent font-bold mt-1 transition-all duration-300">
        ${totalAPagar.toFixed(2)}
      </p>
      {propinaMonto > 0 && (
        <p className="text-[11px] text-text-secondary mt-1">
          Incluye propina ${propinaMonto.toFixed(2)} ({propinaPorcentaje}%)
        </p>
      )}
    </div>
  )
}
