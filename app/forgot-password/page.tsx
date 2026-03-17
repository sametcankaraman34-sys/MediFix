'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import Button from '@/components/Button'
import { logger } from '@/lib/logger'
import Image from 'next/image'
import iconImage from '@/assets/icon.png'

export default function ForgotPasswordPage() {
  const { showSuccess, showError } = useToast()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = () => {
    if (!email) {
      setError('E-posta adresi zorunludur')
      return false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Geçerli bir e-posta adresi girin')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!data.success) {
        showError(data.error || 'Şifre sıfırlama işlemi başarısız oldu')
        return
      }

      logger.log('Password reset request sent:', email)
      
      showSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi')
      setIsSubmitted(true)
    } catch (error) {
      logger.error('Password reset error:', error)
      showError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f5f7fa', padding: '2rem 1rem' }}>
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center">
            <Image
              src={iconImage}
              alt="MediFix Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: '16px', border: 'none', padding: '2rem' }}>
          <div className="text-center mb-4">
            <h1 className="fw-bold text-gray-900 mb-2" style={{ fontSize: '1.5rem' }}>Şifremi Unuttum</h1>
            <p className="text-gray-600 mb-0" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
              {isSubmitted 
                ? 'E-posta adresinizi kontrol edin' 
                : 'E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim'}
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-semibold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>
                  E-posta Adresi
                </label>
                <div className="position-relative">
                  <Mail className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" style={{ zIndex: 10, pointerEvents: 'none' }} />
                  <input
                    type="email"
                    name="email"
                    className={`form-control ps-5 ${error ? 'border-danger' : ''}`}
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) {
                        setError('')
                      }
                    }}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      borderWidth: '1px',
                      fontSize: '0.875rem',
                      borderColor: error ? '#dc3545' : '#dee2e6'
                    }}
                  />
                </div>
                {error && (
                  <p className="text-danger mt-1 mb-0" style={{ fontSize: '0.75rem' }}>{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-100 mb-3 border-0 text-white fw-semibold d-flex align-items-center justify-content-center gap-2"
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: '10px',
                  padding: '0.875rem 1.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
                onMouseDown={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(59, 130, 246, 0.3)'
                  }
                }}
                onMouseUp={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" strokeWidth={2.5} />
                    <span>Şifre Sıfırlama Bağlantısı Gönder</span>
                  </>
                )}
              </button>

              <div className="text-center pt-3" style={{ borderTop: '1px solid #e9ecef' }}>
                <Link
                  href="/login"
                  className="text-decoration-none text-gray-600 d-inline-flex align-items-center gap-1"
                  style={{ fontSize: '0.875rem' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Giriş sayfasına dön
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-2">
              <div className="mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle p-3 mb-3">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg fw-semibold text-gray-900 mb-2">
                  E-posta Gönderildi
                </h3>
                <p className="text-sm text-gray-600 mb-0">
                  <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
                  Lütfen e-posta kutunuzu kontrol edin.
                </p>
              </div>
              <div className="d-flex flex-column gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setIsSubmitted(false)
                    setEmail('')
                  }}
                  className="w-100"
                  style={{ borderRadius: '8px' }}
                >
                  Yeni E-posta Gönder
                </Button>
                <Link
                  href="/login"
                  className="text-decoration-none text-sm text-primary hover:text-primary-dark"
                >
                  Giriş sayfasına dön
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-500 mb-0" style={{ fontSize: '0.75rem' }}>
            ©2026 MediFix. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  )
}
