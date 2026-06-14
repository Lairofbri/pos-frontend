import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children?: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-svh flex items-center justify-center bg-bg-primary noise-bg">
      {children}
    </div>
  )
}
