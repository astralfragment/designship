import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Intentionally empty — wire to error reporting service in production
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-ds-surface-1 px-6 py-12">
          <AlertTriangleIcon className="mb-3 size-8 text-ds-warning" />
          <h2 className="text-sm font-medium text-ds-text-primary">
            Something went wrong
          </h2>
          <p className="mt-1 max-w-sm text-center text-xs text-ds-text-tertiary">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="mt-4 gap-1.5"
          >
            <RefreshCwIcon className="size-3.5" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
