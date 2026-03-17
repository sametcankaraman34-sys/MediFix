'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 d-flex align-items-center justify-content-center p-4">
          <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
            <div className="card-body p-5 text-center">
              <div className="mb-4">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-red-100" style={{ width: '80px', height: '80px' }}>
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-2xl fw-bold text-gray-900 mb-3">
                Bir Hata Oluştu
              </h1>
              
              <p className="text-gray-600 mb-4">
                Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-3 mb-4 text-start">
                  <p className="text-sm fw-semibold text-gray-700 mb-2">Hata Detayı:</p>
                  <p className="text-sm text-gray-600 mb-0 font-monospace">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-sm text-gray-600 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-gray-500 mt-2 overflow-auto" style={{ maxHeight: '200px' }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <button
                  onClick={this.handleReset}
                  className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '8px' }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Tekrar Dene
                </button>
                
                <Link
                  href="/"
                  className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '8px' }}
                >
                  <Home className="h-4 w-4" />
                  Ana Sayfaya Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
