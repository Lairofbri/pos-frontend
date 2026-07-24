import { Component, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '../ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <TriangleAlert className="size-14 text-danger mb-4" />
          <h1 className="font-display text-xl text-text-primary mb-2">Algo salió mal</h1>
          <p className="text-sm text-text-secondary font-body mb-6 max-w-md">
            {this.state.error?.message || 'Ocurrió un error inesperado en la aplicación.'}
          </p>
          <Button onClick={this.handleRetry}>Reintentar</Button>
        </div>
      )
    }

    return this.props.children
  }
}
