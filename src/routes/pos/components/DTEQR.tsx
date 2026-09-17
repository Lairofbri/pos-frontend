import { useQuery } from '@tanstack/react-query'
import { obtenerDTEPorOrden } from '../api'

function formatFechaMH(fechaIso?: string): string {
  if (!fechaIso) return ''
  const d = new Date(fechaIso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

interface DTEQRProps {
  ordenId: string
  cerradoEn?: string
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  generando: 'Generando',
  firmado: 'Firmado',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
  contingencia: 'Contingencia',
  anulado: 'Anulado',
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-300',
  generando: 'bg-sky-100 text-sky-800 border-sky-300',
  firmado: 'bg-sky-100 text-sky-800 border-sky-300',
  enviado: 'bg-sky-100 text-sky-800 border-sky-300',
  aceptado: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rechazado: 'bg-red-100 text-red-800 border-red-300',
  contingencia: 'bg-orange-100 text-orange-800 border-orange-300',
  anulado: 'bg-slate-200 text-slate-700 border-slate-300',
}

export function DTEQR({ ordenId, cerradoEn }: DTEQRProps) {
  const { data: dte } = useQuery({
    queryKey: ['dte', ordenId],
    queryFn: () => obtenerDTEPorOrden(ordenId),
    enabled: !!ordenId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })

  if (!dte) return null

  const estado = dte.estado
  const label = ESTADO_LABEL[estado] ?? estado
  const color = ESTADO_COLOR[estado] ?? 'bg-amber-100 text-amber-800 border-amber-300'
  const aceptado = estado === 'aceptado'

  if (!aceptado) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-2 border-t border-border/40">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
          DTE {label}
        </span>
        <p className="text-[9px] text-text-secondary/60 text-center">
          {estado === 'rechazado'
            ? 'Documento rechazado por Hacienda. Consultá el detalle en Cuentas.'
            : estado === 'contingencia'
              ? 'Hacienda no respondió. Se enviará cuando se restablezca la conexión.'
              : 'La factura se está procesando. Consultá Cuentas para ver el estado final.'}
        </p>
      </div>
    )
  }

  const fecha = formatFechaMH(cerradoEn)
  const consultaUrl = `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${dte.codigo_generacion}&fechaEmision=${fecha}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(consultaUrl)}`

  return (
    <div className="flex flex-col items-center gap-1.5 py-2 border-t border-border/40">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color}`}>
        DTE {label}
      </span>
      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">{dte.numero_control ?? dte.codigo_generacion.slice(0, 8)}</p>
      <img src={qrUrl} alt="QR DTE" className="w-[120px] h-[120px] rounded-lg border border-border/50" />
      <p className="text-[9px] text-text-secondary/60 text-center">Escanea para verificar en MH</p>
    </div>
  )
}