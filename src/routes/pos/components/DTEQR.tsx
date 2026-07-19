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

export function DTEQR({ ordenId, cerradoEn }: DTEQRProps) {
  const { data: dte } = useQuery({
    queryKey: ['dte', ordenId],
    queryFn: () => obtenerDTEPorOrden(ordenId),
    enabled: !!ordenId,
    staleTime: 5 * 60 * 1000,
  })

  if (!dte?.codigo_generacion) return null

  const fecha = formatFechaMH(cerradoEn)
  const consultaUrl = `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${dte.codigo_generacion}&fechaEmision=${fecha}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(consultaUrl)}`

  return (
    <div className="flex flex-col items-center gap-1.5 py-2 border-t border-border/40">
      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">DTE {dte.numero_control ?? dte.codigo_generacion.slice(0, 8)}</p>
      <img src={qrUrl} alt="QR DTE" className="w-[120px] h-[120px] rounded-lg border border-border/50" />
      <p className="text-[9px] text-text-secondary/60 text-center">Escanea para verificar en MH</p>
    </div>
  )
}
