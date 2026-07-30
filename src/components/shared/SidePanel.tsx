import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type DrawerDirection = 'left' | 'right' | 'top' | 'bottom'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  direction?: DrawerDirection
}

const dirClass = [
  'data-[vaul-drawer-direction=right]:!inset-y-0 data-[vaul-drawer-direction=right]:!right-0 data-[vaul-drawer-direction=right]:!left-auto data-[vaul-drawer-direction=right]:!h-full data-[vaul-drawer-direction=right]:!w-full sm:data-[vaul-drawer-direction=right]:!max-w-md data-[vaul-drawer-direction=right]:!rounded-none data-[vaul-drawer-direction=right]:!rounded-l-xl data-[vaul-drawer-direction=right]:!border-0 data-[vaul-drawer-direction=right]:!border-l data-[vaul-drawer-direction=right]:!mt-0 data-[vaul-drawer-direction=right]:!shadow-2xl',
  'data-[vaul-drawer-direction=left]:!inset-y-0 data-[vaul-drawer-direction=left]:!left-0 data-[vaul-drawer-direction=left]:!right-auto data-[vaul-drawer-direction=left]:!h-full data-[vaul-drawer-direction=left]:!w-full sm:data-[vaul-drawer-direction=left]:!max-w-md data-[vaul-drawer-direction=left]:!rounded-none data-[vaul-drawer-direction=left]:!rounded-r-xl data-[vaul-drawer-direction=left]:!border-0 data-[vaul-drawer-direction=left]:!border-r data-[vaul-drawer-direction=left]:!mt-0 data-[vaul-drawer-direction=left]:!shadow-2xl',
  'data-[vaul-drawer-direction=top]:!inset-x-0 data-[vaul-drawer-direction=top]:!top-0 data-[vaul-drawer-direction=top]:!bottom-auto data-[vaul-drawer-direction=top]:!max-h-[50vh] data-[vaul-drawer-direction=top]:!rounded-none data-[vaul-drawer-direction=top]:!rounded-b-xl data-[vaul-drawer-direction=top]:!border-0 data-[vaul-drawer-direction=top]:!border-b data-[vaul-drawer-direction=top]:!mt-0 data-[vaul-drawer-direction=top]:!shadow-2xl',
  'data-[vaul-drawer-direction=bottom]:!max-h-[85vh]',
].join(' ')

export function SidePanel({
  open,
  onClose,
  title,
  children,
  className = '',
  direction = 'right',
}: SidePanelProps) {
  const isSide = direction === 'right' || direction === 'left'

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => { if (!v) onClose() }}
      direction={direction}
      shouldScaleBackground={false}
    >
      <DrawerContent
        className={`${dirClass} ${className}`}
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        {direction === 'bottom' && (
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border shrink-0" />
        )}

        <DrawerHeader className={`flex items-center justify-between gap-2 shrink-0 ${isSide ? 'px-5 py-3' : 'px-4 py-3'} border-b border-border`}>
          <DrawerTitle className="text-lg font-semibold text-text-primary truncate">{title}</DrawerTitle>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </DrawerHeader>

        <div className={`overflow-y-auto ${isSide ? 'flex-1 p-5' : 'p-4'}`}>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
