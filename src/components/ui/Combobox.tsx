import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  label?: string
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  emptyMessage?: string
}

function Combobox({
  label,
  options,
  placeholder = "Seleccionar",
  searchPlaceholder = "Buscar...",
  value,
  onValueChange,
  disabled,
  className,
  emptyMessage = "Sin resultados.",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!newOpen) setSearch("")
    setOpen(newOpen)
  }, [])

  const filtered = React.useMemo(() => {
    if (!search) return options
    const lower = search.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(lower))
  }, [options, search])

  const selectedLabel = options.find((opt) => opt.value === value)?.label

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", !selectedLabel && "text-muted-foreground", className)}
          >
            <span className="truncate">{selectedLabel ?? placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="flex items-center border-b px-3 gap-2">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    opt.value === value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onValueChange?.(opt.value === value ? "" : opt.value)
                    setOpen(false)
                  }}
                >
                  {opt.value === value && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { Combobox }
export type { ComboboxOption, ComboboxProps }
