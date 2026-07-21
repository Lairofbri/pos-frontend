interface ChangeDisplayProps {
  cambio: number
}

export function ChangeDisplay({ cambio }: ChangeDisplayProps) {
  if (cambio <= 0) return null

  return (
    <div className="text-center py-3 rounded-xl bg-success/10 border border-success/30 animate-fadeIn">
      <p className="text-xs text-text-secondary font-body uppercase tracking-wider">Cambio</p>
      <p className="text-xl font-mono text-success font-bold mt-0.5">${cambio.toFixed(2)}</p>
    </div>
  )
}
