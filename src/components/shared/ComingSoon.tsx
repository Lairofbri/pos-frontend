import { Construction } from 'lucide-react'

export default function ComingSoon({
  feature = 'Módulo',
}: {
  feature?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
      <Construction className="size-14 text-text-secondary" />
      <h2 className="font-display text-xl text-text-primary tracking-tight">
        {feature}
      </h2>
      <p className="text-text-secondary text-sm font-body">Próximamente</p>
    </div>
  )
}
