'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gray-50 p-4">
      <div className="text-center" style={{ maxWidth: '600px' }}>
        <div className="mb-4">
          <h1 
            className="fw-bold text-primary mb-0"
            style={{ 
              fontSize: '8rem',
              lineHeight: '1',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            404
          </h1>
        </div>

        <div className="mb-5">
          <h2 className="text-3xl fw-bold text-gray-900 mb-3">
            Sayfa Bulunamadı
          </h2>
          <p className="text-lg text-gray-600 mb-0">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        <div className="mb-5">
          <div 
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 p-4"
            style={{ width: '120px', height: '120px' }}
          >
            <Search className="h-16 w-16 text-primary" />
          </div>
        </div>

        <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
          <Link 
            href="/"
            className="btn-primary d-inline-flex align-items-center justify-content-center gap-2"
            style={{ 
              borderRadius: '12px',
              minWidth: '180px',
              padding: '0.75rem 1.5rem'
            }}
          >
            <Home className="h-5 w-5" />
            Ana Sayfaya Dön
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn-secondary d-inline-flex align-items-center justify-content-center gap-2"
            style={{ 
              borderRadius: '12px',
              minWidth: '180px',
              padding: '0.75rem 1.5rem'
            }}
          >
            <ArrowLeft className="h-5 w-5" />
            Geri Git
          </button>
        </div>

        <div className="mt-5 pt-4 border-top border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Veya şu sayfalardan birine gidin:</p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link href="/" className="text-decoration-none text-primary hover:text-primary-dark">
              Dashboard
            </Link>
            <Link href="/service-requests" className="text-decoration-none text-primary hover:text-primary-dark">
              Servis Talepleri
            </Link>
            <Link href="/appointments" className="text-decoration-none text-primary hover:text-primary-dark">
              Servis Takvimi
            </Link>
            <Link href="/reports" className="text-decoration-none text-primary hover:text-primary-dark">
              Raporlar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
