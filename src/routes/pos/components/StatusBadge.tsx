import type { Mesa } from '../../../types'

type StatusKey = Mesa['estado']

const STATUS_STYLE: Record<StatusKey, { bg: string; border: string; text: string; shadow: string; label: string }> = {
  disponible: {
    bg: '#EAF7EC',
    border: '#67BA78',
    text: '#3A9150',
    shadow: '0 2px 6px rgba(92,180,120,0.15)',
    label: 'LIBRE',
  },
  ocupada: {
    bg: '#FBE8E7',
    border: '#C5544B',
    text: '#A83C36',
    shadow: '0 2px 6px rgba(197,84,75,0.18)',
    label: 'OCUPADA',
  },
  reservada: {
    bg: '#E6F2FB',
    border: '#4E9AD4',
    text: '#2E73B2',
    shadow: '0 2px 6px rgba(78,154,212,0.18)',
    label: 'RESERVADA',
  },
  inactiva: {
    bg: '#F0EBE6',
    border: '#C7BEB5',
    text: '#8C8177',
    shadow: '0 2px 6px rgba(0,0,0,0.06)',
    label: 'INACTIVA',
  },
}

export function StatusBadge({ estado }: { estado: StatusKey }) {
  const s = STATUS_STYLE[estado] ?? STATUS_STYLE.inactiva

  return (
    <span
      className="inline-flex items-center justify-center h-[30px] px-3.5 rounded-full text-[13px] font-semibold tracking-wide leading-[18px] uppercase"
      style={{
        color: s.text,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: s.shadow,
      }}
    >
      {s.label}
    </span>
  )
}
