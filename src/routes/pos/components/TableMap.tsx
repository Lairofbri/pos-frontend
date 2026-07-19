import { useQuery } from '@tanstack/react-query'
import { useToastStore } from '../../../store/toastStore'
import { Icon } from '../../../components/shared/Icon'
import { EmptyState } from '../../../components/shared/EmptyState'
import { ErrorState } from '../../../components/shared/ErrorState'
import { StatusBadge } from './StatusBadge'
import api from '../../../api/client'
import type { Mesa } from '../../../types'

interface TableMapProps {
  onSelectMesa: (mesa: Mesa) => void
}

function MesaCard({ mesa, onClick }: { mesa: Mesa; onClick: (m: Mesa) => void }) {
  return (
    <button
      onClick={() => onClick(mesa)}
      className="group relative w-full rounded-[16px] border-2 border-pos-border pos-wood-texture pos-wood-shadow cursor-pointer hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 ease-out overflow-hidden min-h-[160px]"
    >
      <div className="absolute top-0 left-0 right-0 pointer-events-none h-7 bg-gradient-to-b from-white/[0.22] to-transparent rounded-t-[16px]" />
      <div className="relative h-full p-4 flex flex-col justify-between min-h-[160px]">
        <div className="flex items-start justify-between">
          <span className="font-sans text-[40px] font-medium leading-12 text-pos-text">
            {mesa.numero}
          </span>
          <StatusBadge estado={mesa.estado} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon name="users" className="w-[18px] h-[18px] text-pos-text" />
            <span className="font-sans text-base font-medium text-pos-text">
              {mesa.capacidad}
            </span>
          </div>
          <Icon name="utensils" className="w-[36px] h-[36px] text-pos-text" />
        </div>
      </div>
    </button>
  )
}

function TableMapSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[16px] bg-pos-wood-base animate-pulse h-[160px]"
        />
      ))}
    </div>
  )
}

export function TableMap({ onSelectMesa }: TableMapProps) {
  const showToast = useToastStore(s => s.show)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mesas'],
    queryFn: () => api.get('/mesas')
      .then(r => r.data.data.mesas as Mesa[]),
  })

  const handleClick = (mesa: Mesa) => {
    if (mesa.estado === 'disponible' || mesa.estado === 'ocupada') {
      onSelectMesa(mesa)
    } else {
      showToast({
        type: 'error',
        message: `Mesa ${mesa.estado === 'reservada' ? 'reservada' : 'inactiva'}`,
      })
    }
  }

  if (isLoading) return <TableMapSkeleton />
  if (error) return <ErrorState message="Error al cargar mesas" onRetry={refetch} />
  if (!data?.length) return <EmptyState message="No hay mesas disponibles" />

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {data.map(mesa => (
        <MesaCard key={mesa.id} mesa={mesa} onClick={handleClick} />
      ))}
    </div>
  )
}

