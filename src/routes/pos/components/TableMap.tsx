import { useQuery } from '@tanstack/react-query'
import { useZoneStore } from '../../../store/zoneStore'
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
      className="group relative w-full rounded-[16px] border-2 border-[#C7B39C] pos-wood-texture pos-wood-shadow cursor-pointer hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 ease-out overflow-hidden"
      style={{ minHeight: 160 }}
    >
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: 28,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)',
          borderRadius: '16px 16px 0 0',
        }}
      />
      <div className="relative h-full p-4 flex flex-col justify-between" style={{ minHeight: 160 }}>
        <div className="flex items-start justify-between">
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 40,
              fontWeight: 500,
              lineHeight: '48px',
              color: '#3B281E',
            }}
          >
            {mesa.numero}
          </span>
          <StatusBadge estado={mesa.estado} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon name="users" className="w-[18px] h-[18px] text-[#5C3E2B]" />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 16,
                fontWeight: 500,
                color: '#5C3E2B',
              }}
            >
              {mesa.capacidad}
            </span>
          </div>
          <Icon name="utensils" className="w-[36px] h-[36px] text-[#5C3E2B]" />
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
          className="rounded-[16px] bg-[#F3E8D8] animate-pulse"
          style={{ height: 160 }}
        />
      ))}
    </div>
  )
}

export function TableMap({ onSelectMesa }: TableMapProps) {
  const activeZone = useZoneStore(s => s.zona)
  const showToast = useToastStore(s => s.show)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mesas', activeZone],
    queryFn: () => api.get('/mesas', { params: { zona: activeZone } })
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
  if (!data?.length) return <EmptyState message="No hay mesas en esta zona" />

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {data.map(mesa => (
        <MesaCard key={mesa.id} mesa={mesa} onClick={handleClick} />
      ))}
    </div>
  )
}
