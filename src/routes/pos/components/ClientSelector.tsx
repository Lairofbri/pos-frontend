import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, User, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/Input'
import { buscarClientes } from '../../admin/clientes/api'
import type { Cliente } from '../../../types'

interface ClientSelectorProps {
  selectedClienteId?: string
  selectedClienteNombre?: string
  onSelect: (cliente: Cliente | null) => void
}

export function ClientSelector({ selectedClienteId, selectedClienteNombre, onSelect }: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: results, isLoading } = useQuery({
    queryKey: ['clientes-buscar', search],
    queryFn: () => buscarClientes(search),
    enabled: open && search.length >= 2,
    staleTime: 60000,
  })

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch('') }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer border min-w-0",
            selectedClienteId
              ? "bg-accent/5 border-accent/20 text-accent hover:bg-accent/10"
              : "bg-bg-primary border-border/50 text-text-secondary hover:border-accent/40"
          )}
        >
          {selectedClienteNombre ? (
            <>
              {selectedClienteNombre.includes('Consumidor')
                ? <User className="size-3 shrink-0" />
                : <Building2 className="size-3 shrink-0" />}
              <span className="truncate max-w-[120px]">{selectedClienteNombre}</span>
            </>
          ) : (
            <>
              <User className="size-3 shrink-0" />
              <span>Cliente</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="flex items-center border-b px-3 gap-2">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false) }}
            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-text-secondary"
          >
            Sin cliente (Consumidor Final)
          </button>
          {isLoading && (
            <div className="py-4 text-center text-sm text-text-secondary">Buscando...</div>
          )}
          {!isLoading && search.length >= 2 && results?.length === 0 && (
            <div className="py-4 text-center text-sm text-text-secondary">Sin resultados</div>
          )}
          {results?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c); setOpen(false) }}
              className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            >
              {c.tipo_cliente === 'juridico' ? <Building2 className="size-3.5 shrink-0 opacity-50" /> : <User className="size-3.5 shrink-0 opacity-50" />}
              <span className="flex-1 truncate">{c.razon_social || c.nombre_completo || c.nombre}</span>
              <span className="text-[10px] text-text-secondary/60 shrink-0">
                {c.tipo_cliente === 'juridico' ? (c.nit ? `NIT: ${c.nit}` : 'Empresa') : (c.tipo_documento ? c.tipo_documento.toUpperCase() : '')}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
