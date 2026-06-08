import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-svh flex flex-col bg-bg-primary">
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
      <div className="flex md:hidden flex-1 flex-col min-h-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-3">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
