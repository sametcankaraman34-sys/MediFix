'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Error boundary caught an error:', error)
  }, [error])

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gray-50 p-4">
      <div className="text-center" style={{ maxWidth: '600px' }}>
        <div className="mb-4">
          <div 
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-red-50 p-4"
            style={{ width: '120px', height: '120px' }}
          >
            <AlertTriangle className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <div className="mb-5">
          <h1 className="text-3xl fw-bold text-gray-900 mb-3">
            Bir Hata Oluştu!
          </h1>
          <p className="text-lg text-gray-600 mb-3">
            Üzgünüz, beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-start">
              <p className="text-sm fw-semibold text-red-800 mb-1">Hata Detayı:</p>
              <p className="text-sm text-red-700 mb-0 font-monospace">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2 mb-0">
                  Hata ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
          <button
            onClick={reset}
            className="btn-primary d-inline-flex align-items-center justify-content-center gap-2"
            style={{ 
              borderRadius: '12px',
              minWidth: '180px',
              padding: '0.75rem 1.5rem'
            }}
          >
            <RefreshCw className="h-5 w-5" />
            Tekrar Dene
          </button>
          
          <Link 
            href="/"
            className="btn-secondary d-inline-flex align-items-center justify-content-center gap-2"
            style={{ 
              borderRadius: '12px',
              minWidth: '180px',
              padding: '0.75rem 1.5rem'
            }}
          >
            <Home className="h-5 w-5" />
            Ana Sayfaya Dön
          </Link>
        </div>

        <div className="mt-5 pt-4 border-top border-gray-200">
          <p className="text-sm text-gray-500 mb-0">
            Sorun devam ederse, lütfen destek ekibiyle iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  )
}
