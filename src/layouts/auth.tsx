import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-bg-primary noise-bg">
      <Outlet />
    </div>
  )
}
