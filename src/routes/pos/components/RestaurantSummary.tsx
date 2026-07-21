import { useQuery } from '@tanstack/react-query'
import { queryDefaults } from '../../../config/queries'
import { useCajaActiva } from '../../../hooks/useCajaActiva'
import { getMesas } from '../api'
import { getResumenDiario } from '../../admin/caja/api'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'

const SUMMARY_CARDS = [
  {
    key: 'libres' as const,
    label: 'Libres',
    bg: 'bg-pos-libre-bg',
    border: 'border-pos-libre-border',
    text: 'text-pos-libre-text',
    shadow: 'shadow-[0_2px_6px_rgba(92,180,120,0.15)]',
  },
  {
    key: 'ocupadas' as const,
    label: 'Ocupadas',
    bg: 'bg-pos-ocupada-bg',
    border: 'border-pos-ocupada-border',
    text: 'text-pos-ocupada-text',
    shadow: 'shadow-[0_2px_6px_rgba(197,84,75,0.18)]',
  },
  {
    key: 'reservadas' as const,
    label: 'Reservadas',
    bg: 'bg-pos-reservada-bg',
    border: 'border-pos-reservada-border',
    text: 'text-pos-reservada-text',
    shadow: 'shadow-[0_2px_6px_rgba(78,154,212,0.18)]',
  },
  {
    key: 'inactivas' as const,
    label: 'Inactivas',
    bg: 'bg-bg-surface',
    border: 'border-pos-border',
    text: 'text-pos-text-muted',
    shadow: 'shadow-[0_2px_6px_rgba(0,0,0,0.06)]',
  },
]

function SummaryCard({
  bg,
  border,
  text,
  shadow,
  value,
  label,
}: {
  bg: string
  border: string
  text: string
  shadow: string
  value: number | string
  label: string
}) {
  return (
    <div className={`${bg} ${border} ${shadow} rounded-[18px] p-4 lg:p-[18px] flex flex-col gap-1 min-h-[80px] lg:min-h-[95px] border`}>
      <span className={`${text} text-2xl lg:text-[28px] font-semibold leading-[34px]`}>
        {value}
      </span>
      <span className={`${text}/75 text-xs lg:text-[13px] font-medium leading-[18px]`}>
        {label}
      </span>
    </div>
  )
}

function CajaCard({ estado }: { estado?: string | null }) {
  const abierta = estado === 'abierta'

  return (
    <div className="bg-white rounded-[18px] border border-pos-border pos-summary-shadow px-[18px] py-[14px] lg:p-[18px] flex items-center justify-between min-h-[80px] lg:min-h-[90px]">
      <div>
        <span className="block text-sm font-medium text-pos-text-secondary mb-1.5">
          Caja
        </span>
        <span className="text-base lg:text-[16px] font-semibold text-pos-text">
          {abierta ? 'Abierta' : 'Cerrada'}
        </span>
      </div>
      <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center overflow-hidden ${abierta ? 'bg-pos-libre-bg' : 'bg-pos-ocupada-bg'}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={abierta ? '#3A9150' : '#8C8177'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M12 9v4" />
          <path d="M10 11h4" />
        </svg>
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm lg:text-[14px] font-normal text-pos-text-secondary">
        {label}
      </span>
      <span className="text-sm lg:text-[16px] font-medium text-pos-text">
        {value}
      </span>
    </div>
  )
}

export function RestaurantSummary() {
  const navigate = useNavigate()

  const { data: mesas } = useQuery({
    queryKey: ['mesas'],
    queryFn: getMesas,
    ...queryDefaults('mesas'),
  })

  const { caja: cajaActiva } = useCajaActiva()

  const { data: resumen } = useQuery({
    queryKey: ['caja-resumen-diario'],
    queryFn: () => getResumenDiario(),
    ...queryDefaults('resumen-diario'),
  })

  const counts = useMemo(() => {
    const all = mesas ?? []
    return {
      libres: all.filter(m => m.estado === 'disponible' && m.activo).length,
      ocupadas: all.filter(m => m.estado === 'ocupada' && m.activo).length,
      reservadas: all.filter(m => m.estado === 'reservada' && m.activo).length,
      inactivas: all.filter(m => m.estado === 'inactiva' || !m.activo).length,
    }
  }, [mesas])

  const totalIngresos = resumen?.total_ingresos != null
    ? `$${parseFloat(resumen.total_ingresos).toFixed(2)}`
    : '...'

  const ticketPromedio = resumen?.total_ingresos != null && resumen?.total_ordenes > 0
    ? `$${(parseFloat(resumen.total_ingresos) / resumen.total_ordenes).toFixed(2)}`
    : '-'

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3">
        {SUMMARY_CARDS.map(card => (
          <SummaryCard
            key={card.key}
            bg={card.bg}
            border={card.border}
            text={card.text}
            shadow={card.shadow}
            value={counts[card.key]}
            label={card.label}
          />
        ))}
      </div>

      {/* Caja card */}
      <CajaCard estado={cajaActiva?.estado} />

      {/* Ventas card */}
      <div className="bg-white rounded-[18px] border border-pos-border pos-summary-shadow p-4 lg:p-[18px] flex flex-col gap-0.5">
        <span className="text-sm lg:text-[14px] font-medium text-pos-text-secondary mb-2.5">
          Ventas del día
        </span>
        <MetricRow label="Total" value={totalIngresos} />
        <MetricRow label="Ticket promedio" value={ticketPromedio} />
        <MetricRow label="Clientes" value={String(resumen?.total_ordenes ?? '-')} />
      </div>

      {/* Button */}
      <button
        onClick={() => navigate('/admin/caja')}
        className="h-11 lg:h-[44px] rounded-xl bg-pos-accent text-white text-sm lg:text-base font-semibold border-none cursor-pointer transition-colors hover:bg-pos-accent-hover"
      >
        Ir a Caja
      </button>
    </div>
  )
}

