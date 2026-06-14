export default function ComingSoon({
  feature = 'Módulo',
  icon = '🚧',
}: {
  feature?: string
  icon?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
      <span className="text-5xl">{icon}</span>
      <h2 className="font-display text-xl text-text-primary tracking-tight">
        {feature}
      </h2>
      <p className="text-text-secondary text-sm font-body">Próximamente</p>
    </div>
  )
}
