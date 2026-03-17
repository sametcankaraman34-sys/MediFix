'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { fetchWithAuth } from '@/lib/api'
import { logger } from '@/lib/logger'
import { useToast } from '@/components/ToastContext'

export default function PaymentPage() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [isProcessing, setIsProcessing] = useState(false)
  const [saveCard, setSaveCard] = useState(false)
  const [autoRenewal, setAutoRenewal] = useState(false)
  
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  })

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 16)
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
    setCardData(prev => ({ ...prev, cardNumber: formatted }))
  }

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 4)
    let formatted = cleaned
    if (cleaned.length >= 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2)
    }
    setCardData(prev => ({ ...prev, expiryDate: formatted }))
  }

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 3)
    setCardData(prev => ({ ...prev, cvv: cleaned }))
  }

  const getCardType = (cardNumber: string) => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 1) {
      return 'Visa'
    }
    const firstDigit = cardNumber.replace(/\s/g, '')[0]
    if (firstDigit === '4') return 'Visa'
    if (firstDigit === '5') return 'Mastercard'
    return 'Visa'
  }

  const validateCardData = () => {
    if (cardData.cardNumber.replace(/\s/g, '').length < 16) {
      showError('Lütfen geçerli bir kart numarası giriniz')
      return false
    }
    if (!cardData.cardHolder || cardData.cardHolder.trim().length < 3) {
      showError('Lütfen kart sahibi adını giriniz')
      return false
    }
    if (cardData.expiryDate.length < 5) {
      showError('Lütfen geçerli bir son kullanma tarihi giriniz')
      return false
    }
    if (cardData.cvv.length < 3) {
      showError('Lütfen geçerli bir CVV giriniz')
      return false
    }
    return true
  }

  const handlePurchase = async () => {
    if (!validateCardData()) {
      return
    }

    try {
      setIsProcessing(true)
      
      let paymentCardId: string | number | null = null

      if (saveCard) {
        const cardType = getCardType(cardData.cardNumber)
        const addCardResponse = await fetchWithAuth('/api/account/payment-cards', {
          method: 'POST',
          body: JSON.stringify({
            cardNumber: cardData.cardNumber,
            cardHolder: cardData.cardHolder,
            expiryDate: cardData.expiryDate,
            cardType,
            isDefault: true
          })
        })
        const addCardData = await addCardResponse.json()
        if (addCardData.success && addCardData.data) {
          paymentCardId = addCardData.data.id
        }
      }

      const response = await fetchWithAuth('/api/account/subscription', {
        method: 'PUT',
        body: JSON.stringify({
          plan: 'Pro',
          autoRenewal: autoRenewal,
          paymentCardId: paymentCardId,
          billingPeriod: billingPeriod
        })
      })
      const data = await response.json()
      if (data.success) {
        showSuccess(`Pro plan (${billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'}) başarıyla satın alındı`)
        router.push('/account')
      } else {
        showError(data.error || 'Plan satın alınırken bir hata oluştu')
      }
    } catch (error) {
      logger.error('Error purchasing plan:', error)
      showError('Plan satın alınırken bir hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <button
            className="btn btn-link text-decoration-none mb-4 p-0"
            onClick={() => router.back()}
            style={{ color: '#3b82f6' }}
          >
            <ArrowLeft className="h-4 w-4 me-1" />
            Geri Dön
          </button>

          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h2 className="fw-bold mb-4" style={{ color: '#1f2937' }}>
                Pro Plan Satın Al
              </h2>

              <div className="mb-4">
                <label className="form-label fw-semibold mb-3">Faturalandırma Dönemi</label>
                <div className="d-flex gap-2">
                  <button
                    className={`btn flex-grow-1 ${billingPeriod === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setBillingPeriod('monthly')}
                    style={{
                      background: billingPeriod === 'monthly' ? '#3b82f6' : 'transparent',
                      borderColor: '#3b82f6',
                      color: billingPeriod === 'monthly' ? 'white' : '#3b82f6'
                    }}
                  >
                    Aylık
                  </button>
                  <button
                    className={`btn flex-grow-1 ${billingPeriod === 'yearly' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setBillingPeriod('yearly')}
                    style={{
                      background: billingPeriod === 'yearly' ? '#3b82f6' : 'transparent',
                      borderColor: '#3b82f6',
                      color: billingPeriod === 'yearly' ? 'white' : '#3b82f6'
                    }}
                  >
                    Yıllık
                    {billingPeriod === 'yearly' && (
                      <span className="badge bg-light text-dark ms-2">%17 TASARRUF</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h3 className="fw-bold mb-0" style={{ color: '#3b82f6', fontSize: '1.5rem' }}>
                    Pro Plan
                  </h3>
                  <div>
                    <span className="fw-bold" style={{ fontSize: '2rem', color: '#1f2937' }}>
                      ₺{billingPeriod === 'monthly' ? '499' : '4,999'}
                    </span>
                    <span style={{ color: '#6b7280' }}>/{billingPeriod === 'monthly' ? 'ay' : 'yıl'}</span>
                  </div>
                </div>
                <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                  Tıbbi cihaz servis takibi için tüm pro özellikler.
                </p>
                <ul className="list-unstyled">
                  {[
                    'Sınırsız personel',
                    'Sınırsız servis talebi',
                    'Sınırsız randevu',
                    'Sınırsız rapor',
                    'Gelişmiş analitik',
                    'Öncelikli destek',
                    'Canlı destek'
                  ].map((feature, index) => (
                    <li key={index} className="d-flex align-items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4" style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold mb-3">Ödeme Bilgileri</label>
                <div className="card border">
                  <div className="card-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-medium">Kart Numarası</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        maxLength={19}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-medium">Kart Sahibi</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ad Soyad"
                        value={cardData.cardHolder}
                        onChange={(e) => setCardData(prev => ({ ...prev, cardHolder: e.target.value }))}
                      />
                    </div>
                    <div className="row">
                      <div className="col-6">
                        <label className="form-label small fw-medium">Son Kullanma Tarihi</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="MM/YY"
                          value={cardData.expiryDate}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          maxLength={5}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-medium">CVV</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) => handleCvvChange(e.target.value)}
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="saveCard">
                    Kartımı kaydet
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoRenewal"
                    checked={autoRenewal}
                    onChange={(e) => setAutoRenewal(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="autoRenewal">
                    Otomatik ödeme talimatı ver
                  </label>
                </div>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-lg"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontWeight: '600'
                  }}
                  onClick={handlePurchase}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'İşleniyor...' : `Satın Al - ₺${billingPeriod === 'monthly' ? '499' : '4,999'}`}
                </button>
                <p className="text-muted text-center mb-0" style={{ fontSize: '0.85rem' }}>
                  {billingPeriod === 'yearly' ? 'Yıllık olarak faturalandırılır.' : 'Aylık olarak faturalandırılır.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
