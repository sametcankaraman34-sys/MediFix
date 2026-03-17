'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CreditCard,
  Calendar,
  DollarSign,
  Shield,
  CheckCircle,
  AlertCircle,
  Edit,
  Plus,
  Trash2,
  Download,
  X
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api'
import { logger } from '@/lib/logger'
import { useToast } from '@/components/ToastContext'
import type { BillingHistoryItem, Subscription } from '@/lib/types'

interface PaymentCard {
  id: string | number
  cardNumber: string
  cardHolder: string
  expiryDate: string
  isDefault: boolean
  cardType: string
}

interface Card3DProps {
  card: PaymentCard
  isEditing?: boolean
  onCardNumberChange?: (value: string) => void
  onCardHolderChange?: (value: string) => void
  onExpiryChange?: (value: string) => void
  cardNumberInput?: string
  cardHolderInput?: string
  expiryInput?: string
}

function Card3D({ 
  card, 
  isEditing = false, 
  onCardNumberChange,
  onCardHolderChange,
  onExpiryChange,
  cardNumberInput = '',
  cardHolderInput = '',
  expiryInput = ''
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    setMousePosition({ x, y })
    
    const rotateX = ((y - centerY) / centerY) * 15
    const rotateY = ((centerX - x) / centerX) * 15
    
    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotation({ x: 0, y: 0 })
    setMousePosition({ x: 0, y: 0 })
  }

  const formatCardNumber = (num: string) => {
    const cleaned = num.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ').padEnd(19, '*').substring(0, 19)
  }

  const displayCardNumber = isEditing && cardNumberInput 
    ? formatCardNumber(cardNumberInput).padEnd(19, '*')
    : card.cardNumber

  const displayCardHolder = isEditing && cardHolderInput 
    ? cardHolderInput.toUpperCase() || 'KART SAHİBİ'
    : card.cardHolder.toUpperCase()

  const displayExpiry = isEditing && expiryInput 
    ? expiryInput
    : card.expiryDate

  const getCardBackground = () => {
    if (card.isDefault) {
      if (card.cardType === 'Visa') {
        return 'linear-gradient(135deg, #1a1f71 0%, #192965 50%, #1e3a8a 100%)'
      } else {
        return 'linear-gradient(135deg, #eb001b 0%, #c41e3a 50%, #f79e1b 100%)'
      }
    }
    return 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
  }

  const shadowIntensity = isHovered ? 0.6 : 0.4
  const shadowBlur = isHovered ? 40 : 20
  const shadowY = isHovered ? 30 : 20

  return (
    <div
      ref={cardRef}
      className="position-relative rounded-lg overflow-hidden"
      style={{
        width: '100%',
        aspectRatio: '1.586 / 1',
        transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out, box-shadow 0.3s ease-out',
        boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowIntensity}), 
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                    ${isHovered ? `0 0 40px rgba(255, 255, 255, 0.1)` : ''}`,
        background: getCardBackground(),
        border: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        willChange: 'transform'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: card.cardType === 'Visa' 
            ? 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)'
            : 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          pointerEvents: 'none'
        }}
      />

      <div 
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: card.cardType === 'Visa'
            ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)'
            : 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
          pointerEvents: 'none'
        }}
      />

      <div className="position-absolute top-0 start-0 w-100 h-100 p-4 text-white d-flex flex-column justify-content-between" style={{ zIndex: 1 }}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="position-relative">
            <div 
              className="rounded"
              style={{ 
                width: '3.5rem', 
                height: '2.8rem',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                border: '1px solid rgba(0,0,0,0.2)'
              }}
            >
              <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                <div 
                  className="rounded"
                  style={{
                    width: '85%',
                    height: '70%',
                    background: 'linear-gradient(135deg, #c9a961 0%, #e6c875 50%, #c9a961 100%)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  <div 
                    className="w-100 h-100"
                    style={{
                      background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-end">
            {card.cardType === 'Visa' ? (
              <div 
                className="fw-bold d-flex align-items-center"
                style={{ 
                  fontSize: '1.8rem', 
                  letterSpacing: '3px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                <span style={{ color: '#ffffff' }}>VISA</span>
              </div>
            ) : (
              <div 
                className="d-flex align-items-center gap-1"
                style={{ fontSize: '1.1rem' }}
              >
                <div 
                  className="rounded-circle"
                  style={{
                    width: '2rem',
                    height: '2rem',
                    background: '#eb001b',
                    border: '2px solid #ffffff'
                  }}
                />
                <div 
                  className="rounded-circle"
                  style={{
                    width: '2rem',
                    height: '2rem',
                    background: '#f79e1b',
                    border: '2px solid #ffffff',
                    marginLeft: '-0.8rem'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <div 
            className="fw-bold mb-2" 
            style={{ 
              fontSize: '1.4rem', 
              letterSpacing: '4px',
              fontFamily: '"Courier New", monospace',
              textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.1)',
              fontWeight: '600'
            }}
          >
            {displayCardNumber.split('').map((char, index) => (
              <span 
                key={index}
                style={{ 
                  transition: 'all 0.2s',
                  color: char !== '*' && isEditing && cardNumberInput ? '#ffd700' : '#ffffff',
                  textShadow: char !== '*' && isEditing && cardNumberInput 
                    ? '0 0 10px rgba(255, 215, 0, 0.8), 0 2px 8px rgba(0,0,0,0.5)'
                    : '0 2px 8px rgba(0,0,0,0.5)'
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-end">
          <div>
            <div 
              className="text-xs mb-1" 
              style={{ 
                opacity: 0.8,
                letterSpacing: '1px',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              KART SAHİBİ
            </div>
            <div 
              className="fw-semibold" 
              style={{ 
                fontSize: '0.95rem', 
                letterSpacing: '2px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontFamily: '"Courier New", monospace'
              }}
            >
              {displayCardHolder}
            </div>
          </div>
          <div className="text-end">
            <div 
              className="text-xs mb-1" 
              style={{ 
                opacity: 0.8,
                letterSpacing: '1px',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              SON KULLANMA
            </div>
            <div 
              className="fw-semibold" 
              style={{ 
                fontSize: '0.95rem',
                letterSpacing: '1px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontFamily: '"Courier New", monospace'
              }}
            >
              {displayExpiry}
            </div>
          </div>
        </div>
      </div>

      <div 
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {isHovered && (
        <div 
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.15) 0%, transparent 50%)`,
            pointerEvents: 'none',
            zIndex: 2,
            transition: 'background 0.1s ease-out'
          }}
        />
      )}

      <div 
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 2,
          animation: isHovered ? 'shimmer 2s infinite' : 'none',
          opacity: isHovered ? 1 : 0.5
        }}
      />
    </div>
  )
}

export default function AccountManagement() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [autoRenewal, setAutoRenewal] = useState(true)
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  
  const [newCardData, setNewCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  })

  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([])
  const [usageStats, setUsageStats] = useState({
    personnel: { used: 0, limit: 3 },
    serviceRequests: { used: 0, limit: 5 },
    appointments: { used: 0, limit: 5 },
    reports: { used: 0, limit: 5 }
  })

  useEffect(() => {
    loadSubscription()
    loadPaymentCards()
    loadBillingHistory()
    loadUsageStats()
  }, [])

  const loadUsageStats = async () => {
    try {
      const [personnelRes, serviceRequestsRes, appointmentsRes, reportsRes] = await Promise.all([
        fetchWithAuth('/api/personnel'),
        fetchWithAuth('/api/service-requests'),
        fetchWithAuth('/api/appointments'),
        fetchWithAuth('/api/reports')
      ])

      const personnelData = await personnelRes.json()
      const serviceRequestsData = await serviceRequestsRes.json()
      const appointmentsData = await appointmentsRes.json()
      const reportsData = await reportsRes.json()

      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)

      const serviceRequestsThisMonth = (serviceRequestsData.data || []).filter((sr: any) => {
        const srDate = new Date(sr.created_at || sr.date)
        return srDate >= currentMonth
      }).length

      const appointmentsThisMonth = (appointmentsData.data || []).filter((apt: any) => {
        const aptDate = new Date(apt.created_at || apt.date)
        return aptDate >= currentMonth
      }).length

      const reportsThisMonth = (reportsData.data || []).filter((rep: any) => {
        const repDate = new Date(rep.created_at || rep.date)
        return repDate >= currentMonth
      }).length

      setUsageStats({
        personnel: {
          used: (personnelData.data || []).length,
          limit: 3
        },
        serviceRequests: {
          used: serviceRequestsThisMonth,
          limit: 5
        },
        appointments: {
          used: appointmentsThisMonth,
          limit: 5
        },
        reports: {
          used: reportsThisMonth,
          limit: 5
        }
      })
    } catch (error) {
      logger.error('Error loading usage stats:', error)
    }
  }

  const loadSubscription = async () => {
    try {
      const response = await fetchWithAuth('/api/account/subscription')
      const data = await response.json()
      if (data.success && data.data) {
        setSubscription(data.data)
        setAutoRenewal(data.data.autoRenewal)
        if (data.data.plan === 'Free') {
          await loadUsageStats()
        }
      }
    } catch (error) {
      logger.error('Error loading subscription:', error)
    }
  }

  const handleAutoRenewalChange = async (checked: boolean) => {
    try {
      setAutoRenewal(checked)
      const response = await fetchWithAuth('/api/account/subscription', {
        method: 'PUT',
        body: JSON.stringify({ autoRenewal: checked })
      })
      const data = await response.json()
      if (data.success) {
        setSubscription(data.data)
        showSuccess('Otomatik yenileme ayarı güncellendi')
      } else {
        setAutoRenewal(!checked)
        showError(data.error || 'Ayarlar güncellenirken bir hata oluştu')
      }
    } catch (error) {
      logger.error('Error updating auto renewal:', error)
      setAutoRenewal(!checked)
      showError('Ayarlar güncellenirken bir hata oluştu')
    }
  }

  const loadPaymentCards = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth('/api/account/payment-cards')
      const data = await response.json()
      if (data.success) {
        setPaymentCards(data.data.map((card: any) => ({
          id: card.id,
          cardNumber: card.card_number,
          cardHolder: card.card_holder,
          expiryDate: card.expiry_date,
          isDefault: card.is_default,
          cardType: card.card_type
        })))
      }
    } catch (error) {
      logger.error('Error loading payment cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBillingHistory = async () => {
    try {
      const response = await fetchWithAuth('/api/account/billing-history')
      const data = await response.json()
      if (data.success) {
        setBillingHistory(data.data.map((item: BillingHistoryItem) => ({
          id: item.id,
          date: item.date,
          amount: item.amount,
          plan: item.plan,
          status: item.status,
          invoice: item.invoice
        })))
      }
    } catch (error) {
      logger.error('Error loading billing history:', error)
    }
  }

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 16)
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
    setNewCardData(prev => ({ ...prev, cardNumber: formatted }))
  }

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 4)
    let formatted = cleaned
    if (cleaned.length >= 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2)
    }
    setNewCardData(prev => ({ ...prev, expiryDate: formatted }))
  }

  const luhnCheck = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '')
    if (cleaned.length < 13 || cleaned.length > 19) return false
    
    let sum = 0
    let isEven = false
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10)
      
      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }

  const validateCVV = (cvv: string): boolean => {
    const cleaned = cvv.replace(/\D/g, '')
    return cleaned.length === 3 || cleaned.length === 4
  }

  const getCardType = (cardNumber: string, existingCardType?: string) => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 1) {
      return existingCardType || 'Visa'
    }
    const firstDigit = cardNumber.replace(/\s/g, '')[0]
    if (firstDigit === '4') return 'Visa'
    if (firstDigit === '5') return 'Mastercard'
    return existingCardType || 'Visa'
  }

  const handleAddCard = async () => {
    const cardNumberCleaned = newCardData.cardNumber.replace(/\s/g, '')
    
    if (cardNumberCleaned.length < 13 || cardNumberCleaned.length > 19) {
      showError('Kart numarası 13-19 haneli olmalıdır')
      return
    }
    
    if (!luhnCheck(newCardData.cardNumber)) {
      showError('Geçersiz kart numarası. Lütfen kontrol edin.')
      return
    }
    
    if (!validateCVV(newCardData.cvv)) {
      showError('CVV 3 veya 4 haneli olmalıdır')
      return
    }
    
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/
    if (!expiryRegex.test(newCardData.expiryDate)) {
      showError('Geçersiz son kullanma tarihi. MM/YY formatında olmalıdır.')
      return
    }
    
    const [month, year] = newCardData.expiryDate.split('/')
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
    const now = new Date()
    if (expiryDate < now) {
      showError('Kartın son kullanma tarihi geçmiş')
      return
    }
    
    if (newCardData.cardNumber.length >= 16 && newCardData.cardHolder && newCardData.expiryDate) {
      try {
        const cardType = getCardType(newCardData.cardNumber)
        const isDefault = paymentCards.length === 0

        if (editingCard) {
          const response = await fetchWithAuth('/api/account/payment-cards', {
            method: 'PUT',
            body: JSON.stringify({
              id: editingCard,
              cardNumber: newCardData.cardNumber,
              cardHolder: newCardData.cardHolder,
              expiryDate: newCardData.expiryDate,
              cardType,
              isDefault
            })
          })

          const data = await response.json()
          if (data.success) {
            showSuccess('Kart güncellendi')
            await loadPaymentCards()
          } else {
            showError(data.error || 'Kart güncellenirken bir hata oluştu')
          }
        } else {
          const response = await fetchWithAuth('/api/account/payment-cards', {
            method: 'POST',
            body: JSON.stringify({
              cardNumber: newCardData.cardNumber,
              cardHolder: newCardData.cardHolder,
              expiryDate: newCardData.expiryDate,
              cardType,
              isDefault
            })
          })

          const data = await response.json()
          if (data.success) {
            showSuccess('Kart eklendi')
            await loadPaymentCards()
          } else {
            showError(data.error || 'Kart eklenirken bir hata oluştu')
          }
        }
        
        setNewCardData({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' })
        setEditingCard(null)
        setShowAddCardModal(false)
      } catch (error) {
        logger.error('Error saving card:', error)
        showError('Kart kaydedilirken bir hata oluştu')
      }
    }
  }

  const handleSetDefaultCard = async (cardId: string) => {
    try {
      const response = await fetchWithAuth('/api/account/payment-cards', {
        method: 'PUT',
        body: JSON.stringify({
          id: cardId,
          isDefault: true
        })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess('Varsayılan kart güncellendi')
        await loadPaymentCards()
      } else {
        showError(data.error || 'Kart güncellenirken bir hata oluştu')
      }
    } catch (error) {
      logger.error('Error setting default card:', error)
      showError('Kart güncellenirken bir hata oluştu')
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetchWithAuth(`/api/account/payment-cards?id=${cardId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        showSuccess('Kart silindi')
        await loadPaymentCards()
      } else {
        showError(data.error || 'Kart silinirken bir hata oluştu')
      }
    } catch (error) {
      logger.error('Error deleting card:', error)
      showError('Kart silinirken bir hata oluştu')
    }
  }

  const handleEditCard = (cardId: string) => {
    setEditingCard(cardId)
    const card = paymentCards.find(c => String(c.id) === cardId)
    if (card) {
      setNewCardData({
        cardNumber: card.cardNumber.replace(/\s/g, ''),
        cardHolder: card.cardHolder,
        expiryDate: card.expiryDate,
        cvv: ''
      })
      setShowAddCardModal(true)
    }
  }

  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Shield className="h-8 w-8" style={{ color: '#1f2937' }} />
          <div>
            <h1 className="text-3xl fw-bold mb-0" style={{ color: '#1f2937' }}>Hesap Yönetimi</h1>
            <p className="mt-1 text-sm mb-0" style={{ color: '#6b7280' }}>
              Abonelik bilgilerinizi ve ödeme yöntemlerinizi yönetin
            </p>
          </div>
        </div>
        {subscription && (
          <div className="d-flex align-items-center gap-2">
            <span className="badge" style={{
              background: subscription.plan === 'Pro' ? '#3b82f6' : '#6b7280',
              color: 'white',
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: '600',
              borderRadius: '8px'
            }}>
              {subscription.plan === 'Pro' ? 'Pro Hesap' : 'Free Hesap'}
            </span>
          </div>
        )}
      </div>

      <div className="row g-4 justify-content-center">
        <div className="col-12 col-lg-8" style={{ maxWidth: '1400px' }}>
          {subscription && subscription.status === 'Aktif' && subscription.plan !== 'Free' ? (
            <div className="card mb-4">
              <div className="p-4 p-md-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg fw-semibold text-gray-900 mb-0">Aktif Abonelik</h3>
                  </div>
                  <span className="badge bg-success">
                    {subscription.status}
                  </span>
                </div>

                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <div className="border rounded-lg p-3">
                      <p className="text-sm text-gray-500 mb-2">Mevcut Plan</p>
                      <p className="text-2xl fw-bold text-gray-900 mb-0">{subscription.plan} Plan</p>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="border rounded-lg p-3">
                      <p className="text-sm text-gray-500 mb-2">Aylık Ücret</p>
                      <p className="text-2xl fw-bold text-gray-900 mb-0">₺{subscription.monthlyPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="border rounded-lg p-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Abonelik Bitiş Tarihi</p>
                          <p className="text-lg fw-semibold text-gray-900 mb-0">
                            {subscription.endDate 
                              ? new Date(subscription.endDate).toLocaleDateString('tr-TR', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'Sınırsız'}
                          </p>
                          <p className="text-xs text-gray-500 mb-0 mt-1">
                            {subscription.autoRenewal ? 'Otomatik yenileme aktif' : 'Otomatik yenileme kapalı'}
                          </p>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-top">
                  <button 
                    className="btn btn-outline-danger"
                    onClick={async () => {
                      if (confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz?')) {
                        try {
                          const response = await fetchWithAuth('/api/account/subscription', {
                            method: 'PUT',
                            body: JSON.stringify({ 
                              status: 'İptal Edildi',
                              autoRenewal: false
                            })
                          })
                          const data = await response.json()
                          if (data.success) {
                            showSuccess('Abonelik iptal edildi')
                            await loadSubscription()
                          } else {
                            showError(data.error || 'Abonelik iptal edilirken bir hata oluştu')
                          }
                        } catch (error) {
                          logger.error('Error canceling subscription:', error)
                          showError('Abonelik iptal edilirken bir hata oluştu')
                        }
                      }
                    }}
                  >
                    Aboneliği İptal Et
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              {subscription && subscription.plan === 'Free' && (
                <div className="card mb-4" style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <h3 className="fw-bold mb-0" style={{ color: '#1f2937', fontSize: '1.25rem' }}>
                        Free Account
                      </h3>
                    </div>
                    <div className="row g-4">
                      <div className="col-12 col-md-6 col-lg-3">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-sm fw-medium" style={{ color: '#6b7280' }}>Personel</span>
                            <span className="text-sm fw-bold" style={{ color: usageStats.personnel.used >= usageStats.personnel.limit ? '#ef4444' : '#1f2937' }}>
                              {usageStats.personnel.used} / {usageStats.personnel.limit}
                            </span>
                          </div>
                          <div 
                            className="progress" 
                            style={{ 
                              height: '12px', 
                              borderRadius: '6px', 
                              backgroundColor: '#f3f4f6',
                              overflow: 'hidden',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${Math.min((usageStats.personnel.used / usageStats.personnel.limit) * 100, 100)}%`,
                                backgroundColor: usageStats.personnel.used >= usageStats.personnel.limit 
                                  ? '#ef4444' 
                                  : usageStats.personnel.used >= usageStats.personnel.limit * 0.8
                                  ? '#f59e0b'
                                  : '#3b82f6',
                                borderRadius: '6px',
                                transition: 'width 0.3s ease, background-color 0.3s ease',
                                boxShadow: usageStats.personnel.used > 0 ? '0 1px 3px rgba(59, 130, 246, 0.3)' : 'none'
                              }}
                            />
                          </div>
                          <div className="mt-1">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>
                              {Math.max(0, usageStats.personnel.limit - usageStats.personnel.used)} kullanım hakkı kaldı
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6 col-lg-3">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-sm fw-medium" style={{ color: '#6b7280' }}>Servis Talebi</span>
                            <span className="text-sm fw-bold" style={{ color: usageStats.serviceRequests.used >= usageStats.serviceRequests.limit ? '#ef4444' : '#1f2937' }}>
                              {usageStats.serviceRequests.used} / {usageStats.serviceRequests.limit}
                            </span>
                          </div>
                          <div 
                            className="progress" 
                            style={{ 
                              height: '12px', 
                              borderRadius: '6px', 
                              backgroundColor: '#f3f4f6',
                              overflow: 'hidden',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${Math.min((usageStats.serviceRequests.used / usageStats.serviceRequests.limit) * 100, 100)}%`,
                                backgroundColor: usageStats.serviceRequests.used >= usageStats.serviceRequests.limit 
                                  ? '#ef4444' 
                                  : usageStats.serviceRequests.used >= usageStats.serviceRequests.limit * 0.8
                                  ? '#f59e0b'
                                  : '#3b82f6',
                                borderRadius: '6px',
                                transition: 'width 0.3s ease, background-color 0.3s ease',
                                boxShadow: usageStats.serviceRequests.used > 0 ? '0 1px 3px rgba(59, 130, 246, 0.3)' : 'none'
                              }}
                            />
                          </div>
                          <div className="mt-1">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>
                              {Math.max(0, usageStats.serviceRequests.limit - usageStats.serviceRequests.used)} kullanım hakkı kaldı
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6 col-lg-3">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-sm fw-medium" style={{ color: '#6b7280' }}>Randevu</span>
                            <span className="text-sm fw-bold" style={{ color: usageStats.appointments.used >= usageStats.appointments.limit ? '#ef4444' : '#1f2937' }}>
                              {usageStats.appointments.used} / {usageStats.appointments.limit}
                            </span>
                          </div>
                          <div 
                            className="progress" 
                            style={{ 
                              height: '12px', 
                              borderRadius: '6px', 
                              backgroundColor: '#f3f4f6',
                              overflow: 'hidden',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${Math.min((usageStats.appointments.used / usageStats.appointments.limit) * 100, 100)}%`,
                                backgroundColor: usageStats.appointments.used >= usageStats.appointments.limit 
                                  ? '#ef4444' 
                                  : usageStats.appointments.used >= usageStats.appointments.limit * 0.8
                                  ? '#f59e0b'
                                  : '#3b82f6',
                                borderRadius: '6px',
                                transition: 'width 0.3s ease, background-color 0.3s ease',
                                boxShadow: usageStats.appointments.used > 0 ? '0 1px 3px rgba(59, 130, 246, 0.3)' : 'none'
                              }}
                            />
                          </div>
                          <div className="mt-1">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>
                              {Math.max(0, usageStats.appointments.limit - usageStats.appointments.used)} kullanım hakkı kaldı
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6 col-lg-3">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-sm fw-medium" style={{ color: '#6b7280' }}>Rapor</span>
                            <span className="text-sm fw-bold" style={{ color: usageStats.reports.used >= usageStats.reports.limit ? '#ef4444' : '#1f2937' }}>
                              {usageStats.reports.used} / {usageStats.reports.limit}
                            </span>
                          </div>
                          <div 
                            className="progress" 
                            style={{ 
                              height: '12px', 
                              borderRadius: '6px', 
                              backgroundColor: '#f3f4f6',
                              overflow: 'hidden',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${Math.min((usageStats.reports.used / usageStats.reports.limit) * 100, 100)}%`,
                                backgroundColor: usageStats.reports.used >= usageStats.reports.limit 
                                  ? '#ef4444' 
                                  : usageStats.reports.used >= usageStats.reports.limit * 0.8
                                  ? '#f59e0b'
                                  : '#3b82f6',
                                borderRadius: '6px',
                                transition: 'width 0.3s ease, background-color 0.3s ease',
                                boxShadow: usageStats.reports.used > 0 ? '0 1px 3px rgba(59, 130, 246, 0.3)' : 'none'
                              }}
                            />
                          </div>
                          <div className="mt-1">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>
                              {Math.max(0, usageStats.reports.limit - usageStats.reports.used)} kullanım hakkı kaldı
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-center mb-5">
                <h2 
                  className="mb-2"
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: '#1f2937'
                  }}
                >
                  Basit ölçeklenebilir fiyatlandırma.
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                  Ekstra ücret yok. Gizli ücret yok.
                </p>
              </div>

              <div className="d-flex justify-content-center mb-5">
                <div 
                  className="btn-group"
                  role="group"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <input
                    type="radio"
                    className="btn-check"
                    name="billingPeriod"
                    id="monthly"
                    checked={billingPeriod === 'monthly'}
                    onChange={() => setBillingPeriod('monthly')}
                  />
                  <label 
                    className="btn"
                    htmlFor="monthly"
                    style={{
                      background: billingPeriod === 'monthly' ? '#3b82f6' : 'transparent',
                      color: billingPeriod === 'monthly' ? 'white' : '#6b7280',
                      border: 'none',
                      padding: '10px 24px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Aylık
                  </label>
                  <input
                    type="radio"
                    className="btn-check"
                    name="billingPeriod"
                    id="yearly"
                    checked={billingPeriod === 'yearly'}
                    onChange={() => setBillingPeriod('yearly')}
                  />
                  <label 
                    className="btn"
                    htmlFor="yearly"
                    style={{
                      background: billingPeriod === 'yearly' ? '#3b82f6' : 'transparent',
                      color: billingPeriod === 'yearly' ? 'white' : '#6b7280',
                      border: 'none',
                      padding: '10px 24px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Yıllık
                  </label>
                </div>
              </div>

              <div className="row g-4 justify-content-center" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="col-12 col-lg-5 col-xl-5">
                  <div 
                    className="bg-white rounded-4 p-4 h-100"
                    style={{
                      boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'pointer',
                      border: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)'
                      e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  >
                    <div className="text-center mb-3">
                      <h3 
                        className="fw-bold mb-3"
                        style={{ color: '#3b82f6', fontSize: '1.5rem' }}
                      >
                        Free
                      </h3>
                      <div className="mb-2">
                        <span 
                          className="fw-bold"
                          style={{ fontSize: '2.5rem', color: '#1f2937' }}
                        >
                          ₺0
                        </span>
                        <span style={{ color: '#6b7280' }}>/ay</span>
                      </div>
                      <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                        Tıbbi cihaz servis takibi için temel özellikler.
                      </p>
                      <button
                        className="btn w-100 mb-2"
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2563eb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#3b82f6'
                        }}
                        onClick={async () => {
                          try {
                            const response = await fetchWithAuth('/api/account/subscription', {
                              method: 'PUT',
                              body: JSON.stringify({
                                plan: 'Free',
                                autoRenewal: false
                              })
                            })
                            const data = await response.json()
                            if (data.success) {
                              showSuccess('Free plan başarıyla seçildi')
                              await loadSubscription()
                            } else {
                              showError(data.error || 'Plan seçilirken bir hata oluştu')
                            }
                          } catch (error) {
                            logger.error('Error selecting free plan:', error)
                            showError('Plan seçilirken bir hata oluştu')
                          }
                        }}
                      >
                        Başlayın
                      </button>
                    </div>
                    <ul className="list-unstyled mt-4">
                      {[
                        'Maksimum 3 personel',
                        'Aylık 5 servis talebi',
                        'Aylık 5 randevu',
                        'Aylık 5 rapor',
                        'Temel analitik',
                        'E-posta destek'
                      ].map((feature, index) => (
                        <li key={index} className="d-flex align-items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4" style={{ color: '#3b82f6' }} />
                          <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="col-12 col-lg-5 col-xl-5">
                  <div 
                    className="bg-white rounded-4 p-4 h-100 position-relative"
                    style={{
                      boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'pointer',
                      border: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)'
                      e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  >
                    {billingPeriod === 'yearly' && (
                      <div 
                        className="position-absolute top-0 end-0 m-3"
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}
                      >
                        %17 TASARRUF
                      </div>
                    )}
                    <div className="text-center mb-3">
                      <h3 
                        className="fw-bold mb-3"
                        style={{ color: '#3b82f6', fontSize: '1.5rem' }}
                      >
                        Pro
                      </h3>
                      <div className="mb-2">
                        <span 
                          className="fw-bold"
                          style={{ fontSize: '2.5rem', color: '#1f2937' }}
                        >
                          ₺{billingPeriod === 'monthly' ? '499' : '4,999'}
                        </span>
                        <span style={{ color: '#6b7280' }}>/{billingPeriod === 'monthly' ? 'ay' : 'yıl'}</span>
                      </div>
                      <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                        Tıbbi cihaz servis takibi için tüm pro özellikler.
                      </p>
                      <button
                        className="btn w-100 mb-2"
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2563eb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#3b82f6'
                        }}
                        onClick={() => {
                          router.push('/payment')
                        }}
                      >
                        Başlayın
                      </button>
                      <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                        {billingPeriod === 'yearly' ? 'Yıllık olarak faturalandırılır.' : 'Aylık olarak faturalandırılır.'}
                      </p>
                    </div>
                    <ul className="list-unstyled mt-4">
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
                </div>
              </div>
            </div>
          )}

          {subscription && subscription.status === 'Aktif' && subscription.plan !== 'Free' && (
            <>
              <div className="card">
                <div className="p-4 p-md-5">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg fw-semibold text-gray-900 mb-0">Ödeme Geçmişi</h3>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th className="text-sm fw-medium text-gray-700">Tarih</th>
                          <th className="text-sm fw-medium text-gray-700">Plan</th>
                          <th className="text-sm fw-medium text-gray-700">Tutar</th>
                          <th className="text-sm fw-medium text-gray-700">Durum</th>
                          <th className="text-sm fw-medium text-gray-700">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.map((item) => (
                          <tr key={item.id}>
                            <td className="text-sm text-gray-900">{item.date}</td>
                            <td className="text-sm text-gray-600">{item.plan}</td>
                            <td className="text-sm fw-semibold text-gray-900">{item.amount}</td>
                            <td>
                              <span className="badge bg-success">{item.status}</span>
                            </td>
                            <td>
                              {item.invoice && (
                                <button className="btn btn-link btn-sm p-0 text-primary text-decoration-none">
                                  <Download className="h-4 w-4 me-1" />
                                  Fatura İndir
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {subscription && subscription.status === 'Aktif' && subscription.plan !== 'Free' && (
          <div className="col-12 col-lg-4">
            <div className="card mb-4">
              <div className="p-4 p-md-5">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg fw-semibold text-gray-900 mb-0">Ödeme Yöntemleri</h3>
                  </div>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      setNewCardData({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' })
                      setEditingCard(null)
                      setShowAddCardModal(true)
                    }}
                  >
                    <Plus className="h-4 w-4 me-1" />
                    Yeni Kart
                  </button>
                </div>

                <div className="d-flex flex-column gap-3">
                  {paymentCards.map((card) => (
                    <div key={card.id}>
                      <Card3D card={card} />
                      <div className="d-flex gap-2 mt-3">
                        {!card.isDefault && (
                          <button
                            onClick={() => handleSetDefaultCard(String(card.id))}
                            className="btn btn-sm btn-outline-primary flex-grow-1"
                          >
                            Varsayılan Yap
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleEditCard(String(card.id))}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(String(card.id))}
                          className="btn btn-sm btn-outline-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="p-4 p-md-5">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg fw-semibold text-gray-900 mb-0">Otomatik Yenileme</h3>
                </div>

                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <p className="text-sm fw-medium text-gray-900 mb-1">
                      Otomatik Yenileme
                    </p>
                    <p className="text-xs text-gray-500 mb-0">
                      Aboneliğiniz otomatik olarak yenilenecek
                    </p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={autoRenewal}
                      onChange={(e) => handleAutoRenewalChange(e.target.checked)}
                      id="autoRenewal"
                    />
                    <label className="form-check-label" htmlFor="autoRenewal"></label>
                  </div>
                </div>

                <div className="alert alert-info mb-0">
                  <p className="text-xs mb-0">
                    Otomatik yenileme aktif olduğunda, aboneliğiniz bitiş tarihinde otomatik olarak yenilenecektir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddCardModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center z-50"
          style={{ zIndex: 1050 }}
          onClick={() => {
            setShowAddCardModal(false)
            setEditingCard(null)
            setNewCardData({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' })
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg p-4 p-md-5"
            style={{ width: '90%', maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="text-lg fw-semibold text-gray-900 mb-0">
                {editingCard ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowAddCardModal(false)
                  setEditingCard(null)
                  setNewCardData({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' })
                }}
                className="btn btn-link p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <Card3D
                card={{
                  id: editingCard || 0,
                  cardNumber: newCardData.cardNumber || '**** **** **** ****',
                  cardHolder: newCardData.cardHolder || 'KART SAHİBİ',
                  expiryDate: newCardData.expiryDate || 'MM/YY',
                  isDefault: editingCard ? paymentCards.find(c => c.id === editingCard)?.isDefault || false : false,
                  cardType: editingCard 
                    ? getCardType(newCardData.cardNumber, paymentCards.find(c => c.id === editingCard)?.cardType)
                    : getCardType(newCardData.cardNumber)
                }}
                isEditing={true}
                cardNumberInput={newCardData.cardNumber}
                cardHolderInput={newCardData.cardHolder}
                expiryInput={newCardData.expiryDate}
                onCardNumberChange={handleCardNumberChange}
                onCardHolderChange={(value) => setNewCardData(prev => ({ ...prev, cardHolder: value }))}
                onExpiryChange={handleExpiryChange}
              />
            </div>

            <div className="d-flex flex-column gap-3">
              <div>
                <label className="form-label text-sm fw-medium text-gray-700">
                  Kart Numarası
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="1234 5678 9012 3456"
                  value={newCardData.cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  maxLength={19}
                />
              </div>
              <div>
                <label className="form-label text-sm fw-medium text-gray-700">
                  Kart Sahibi
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="KART SAHİBİ"
                  value={newCardData.cardHolder}
                  onChange={(e) => setNewCardData(prev => ({ ...prev, cardHolder: e.target.value }))}
                />
              </div>
              <div className="row g-3">
                <div className="col-8">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    Son Kullanma Tarihi
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="MM/YY"
                    value={newCardData.expiryDate}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    CVV
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="123"
                    value={newCardData.cvv}
                    onChange={(e) => setNewCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').substring(0, 3) }))}
                    maxLength={3}
                  />
                </div>
              </div>
              <div className="d-flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setShowAddCardModal(false)
                    setEditingCard(null)
                    setNewCardData({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' })
                  }}
                  className="btn btn-outline-secondary flex-grow-1"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddCard}
                  className="btn-primary flex-grow-1"
                  disabled={newCardData.cardNumber.length < 16 || !newCardData.cardHolder || !newCardData.expiryDate}
                >
                  {editingCard ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
