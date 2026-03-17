'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Plus, Search, Filter, Activity, Clock, CheckCircle, AlertCircle, TrendingUp, ChevronDown, X, Calendar, ChevronLeft, ChevronRight, Eye, Edit, Trash2, User, AlertTriangle, MapPin } from 'lucide-react'
import { ServiceRequest, ChecklistItem } from '@/lib/types'
import { serviceRequestSchema, formatZodError, type ServiceRequestFormData } from '@/lib/validation'
import { fetchServiceRequests, createServiceRequest, updateServiceRequest, deleteServiceRequest } from '@/lib/api'
import { logger } from '@/lib/logger'
import { useToast } from '@/components/ToastContext'
import { formatDate } from '@/lib/utils'
import Button from '@/components/Button'

export default function ServiceRequests() {
  const { showSuccess, showError, showWarning } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tüm Durumlar')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 10))
  const filterRef = useRef<HTMLDivElement>(null)
  const priorityRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<{
    title: string
    equipment: string
    priority: 'Düşük' | 'Orta' | 'Yüksek'
    status: 'Bekleyen' | 'Devam Eden' | 'Tamamlanan' | 'İptal Edilen'
    location: string
    date: string
  }>({
    title: '',
    equipment: '',
    priority: 'Orta',
    status: 'Bekleyen',
    location: '',
    date: '10.01.2026'
  })

  const [checklist, setChecklist] = useState<Record<string, Record<string, boolean>>>({
    'Valf ve Fonksiyon Butonları': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
    'Hava ve Su': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
    'Biyopsi Kanalı': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
    'Göz Merceği': { 'Puslu/Buğulu': false, 'Görüntü Bozuk': false, 'OK': false },
    'Açı Kontrol Kumandası': { 'Boşluk Var': false, 'Fren': false, 'OK': false },
    'Elçek': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
    'LG Tüpü': { 'Bükülmüş/Ezilmiş/Kırık': false, 'Yüzeyi Hasarı': false, 'OK': false },
    'Insertion Tüpü': { 'Bükülmüş/Ezilmiş/Kırık': false, 'Yüzeyi Hasarı': false, 'OK': false },
    'LG Konnektör': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
    'Uç Kısım': { 'Lens/Optik Hasarı': false, 'Nozul': false, 'OK': false },
    'Optik Fiber': { 'Kırık': false, 'Işık Çıkışı': false, 'OK': false },
    'Uç Açılar': { 'Yetersiz': false, 'Kılıf Sızdırıyor': false, 'OK': false }
  })

  const filterOptions = [
    'Tüm Durumlar',
    'Bekleyen',
    'Devam Eden',
    'Tamamlanan',
    'İptal Edilen'
  ]

  const priorityOptions = ['Düşük', 'Orta', 'Yüksek'] as const
  const statusOptions = ['Bekleyen', 'Devam Eden', 'Tamamlanan', 'İptal Edilen'] as const

  const loadServiceRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchServiceRequests()
      if (Array.isArray(data)) {
        setServiceRequests(data)
      } else {
        setServiceRequests([])
      }
    } catch (error) {
      logger.error('Error loading service requests:', error)
      const errorMessage = 'Servis talepleri yüklenirken bir hata oluştu'
      setError(errorMessage)
      showError(errorMessage)
      setServiceRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadServiceRequests()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false)
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const dayNames = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const firstDay = new Date(year, month, 1)
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false, isSelected: false       })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i)
      days.push({ 
        day: i, 
        isCurrentMonth: true, 
        isSelected: dayDate.getTime() === selectedDate.getTime()
      })
    }

    const totalCells = 42
    const remainingDays = totalCells - days.length
    for (let i = 0; i < remainingDays; i++) {
      days.push({ day: null, isCurrentMonth: false, isSelected: false })
    }

    return days
  }


  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])

  const stats = useMemo(() => [
    { name: 'Toplam Talep', value: serviceRequests.length.toString(), icon: TrendingUp, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', iconBg: 'bg-white' },
    { name: 'Bekleyen', value: serviceRequests.filter(r => r.status === 'Bekleyen').length.toString(), icon: Clock, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600', iconBg: 'bg-white' },
    { name: 'Tamamlanan', value: serviceRequests.filter(r => r.status === 'Tamamlanan').length.toString(), icon: CheckCircle, bgColor: 'bg-green-50', iconColor: 'text-green-600', iconBg: 'bg-white' },
    { name: 'Yüksek Öncelik', value: serviceRequests.filter(r => r.priority === 'Yüksek').length.toString(), icon: AlertCircle, bgColor: 'bg-red-50', iconColor: 'text-red-600', iconBg: 'bg-white' },
  ], [serviceRequests])

  const filteredServiceRequests = useMemo(() => {
    return serviceRequests.filter(request => {
      const matchesSearch = searchTerm === '' || 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.equipment.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'Tüm Durumlar' || request.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [serviceRequests, searchTerm, statusFilter])

  const getPriorityBadgeColor = useCallback((priority: string) => {
    switch (priority) {
      case 'Yüksek': return { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#dc2626' }
      case 'Orta': return { backgroundColor: '#fed7aa', color: '#9a3412', borderColor: '#ea580c' }
      case 'Düşük': return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#16a34a' }
      default: return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#9ca3af' }
    }
  }, [])

  const getStatusBadgeColor = useCallback((status: string) => {
    switch (status) {
      case 'Bekleyen': return { backgroundColor: '#fed7aa', color: '#9a3412', borderColor: '#ea580c' }
      case 'Devam Eden': return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#2563eb' }
      case 'Tamamlanan': return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#16a34a' }
      case 'İptal Edilen': return { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#dc2626' }
      default: return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#9ca3af' }
    }
  }, [])

  const handleCreateRequest = async () => {
    if (isCreating) return
    
    try {
      setIsCreating(true)
      
      const validationData = {
        ...formData,
        checklist
      }
      const validationResult = serviceRequestSchema.safeParse(validationData)

      if (!validationResult.success) {
        const errors = formatZodError(validationResult.error)
        logger.warn('Form validation errors:', errors)
        setFormErrors(errors)
        showError('Lütfen formu doğru şekilde doldurun')
        const firstErrorField = Object.keys(errors)[0]
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          ;(errorElement as HTMLElement).focus()
        }
        return
      }

      const validatedData = validationResult.data

      const newRequestData = {
        title: validatedData.title,
        equipment: validatedData.equipment,
        priority: validatedData.priority,
        status: validatedData.status,
        assignedTo: null,
        date: validatedData.date,
        location: validatedData.location || '',
        checklist: validatedData.checklist || {}
      }
      
      await createServiceRequest(newRequestData)
      
      await loadServiceRequests()
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('serviceRequestChanged'))
        window.dispatchEvent(new CustomEvent('notificationAdded'))
      }
      
      setFormData({
        title: '',
        equipment: '',
        priority: 'Orta',
        status: 'Bekleyen',
        location: '',
        date: formatDate(new Date())
      })
      setChecklist({
        'Valf ve Fonksiyon Butonları': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
        'Hava ve Su': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
        'Biyopsi Kanalı': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
        'Göz Merceği': { 'Puslu/Buğulu': false, 'Görüntü Bozuk': false, 'OK': false },
        'Açı Kontrol Kumandası': { 'Boşluk Var': false, 'Fren': false, 'OK': false },
        'Elçek': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
        'LG Tüpü': { 'Bükülmüş/Ezilmiş/Kırık': false, 'Yüzeyi Hasarı': false, 'OK': false },
        'Insertion Tüpü': { 'Bükülmüş/Ezilmiş/Kırık': false, 'Yüzeyi Hasarı': false, 'OK': false },
        'LG Konnektör': { 'Kaçak/Sızıntı': false, 'Arızalı': false, 'OK': false },
        'Uç Kısım': { 'Lens/Optik Hasarı': false, 'Nozul': false, 'OK': false },
        'Optik Fiber': { 'Kırık': false, 'Işık Çıkışı': false, 'OK': false },
        'Uç Açılar': { 'Yetersiz': false, 'Kılıf Sızdırıyor': false, 'OK': false }
      })
      setShowNewRequestModal(false)
      setFormErrors({})
      showSuccess('Servis talebi başarıyla oluşturuldu')
    } catch (error) {
      logger.error('Error creating request:', error)
      showError('Servis talebi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditRequest = useCallback((request: ServiceRequest) => {
    setSelectedRequest(request)
    setFormData({
      title: request.title,
      equipment: request.equipment,
      priority: request.priority,
      status: request.status,
      location: request.location,
      date: request.date
    })
    setChecklist(request.checklist)
    setShowEditModal(true)
  }, [])

  const handleUpdateRequest = async () => {
    if (!selectedRequest || isUpdating) return
    
    try {
      setIsUpdating(true)
      
      const updateData = {
        title: formData.title,
        equipment: formData.equipment,
        priority: formData.priority as 'Düşük' | 'Orta' | 'Yüksek',
        status: formData.status as 'Bekleyen' | 'Devam Eden' | 'Tamamlanan' | 'İptal Edilen',
        location: formData.location,
        date: formData.date,
        checklist: checklist
      }
      
      await updateServiceRequest(selectedRequest.id.toString(), updateData)
      
      await loadServiceRequests()
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('serviceRequestChanged'))
      }
      
      setShowEditModal(false)
      setSelectedRequest(null)
      showSuccess('Servis talebi başarıyla güncellendi')
    } catch (error) {
      logger.error('Error updating request:', error)
      showError('Servis talebi güncellenirken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!selectedRequest || isDeleting) return
    
    try {
      setIsDeleting(true)
      
      const deleteId = selectedRequest.id.toString()
      await deleteServiceRequest(deleteId)
      
      setServiceRequests(prev => prev.filter(req => req.id.toString() !== deleteId))
      
      await loadServiceRequests()
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('serviceRequestChanged'))
      }
      
      setShowDeleteModal(false)
      setSelectedRequest(null)
      showSuccess('Servis talebi başarıyla silindi')
    } catch (error) {
      logger.error('Error deleting request:', error)
      showError('Servis talebi silinirken bir hata oluştu. Lütfen tekrar deneyin.')
      await loadServiceRequests()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewRequest = useCallback((request: ServiceRequest) => {
    setSelectedRequest(request)
    setShowDetailModal(true)
  }, [])

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
        <div className="mb-3 mb-sm-0">
          <h1 className="text-3xl fw-bold text-gray-900 mb-0">Servis Talepleri</h1>
          <p className="mt-1 text-sm text-gray-500 mb-0">
            Tüm servis taleplerini yönetin ve takip edin
          </p>
        </div>
        <button 
          className="btn-primary"
          style={{ borderRadius: '8px' }}
          onClick={() => setShowNewRequestModal(true)}
        >
          <Plus className="h-4 w-4 me-2" />
          Yeni Talep
        </button>
      </div>

      <div className="row g-4 mb-4">
        {stats.map((stat) => (
          <div key={stat.name} className="col-12 col-sm-6 col-lg-3">
            <div 
              className={`${stat.bgColor} rounded-lg p-4 border border-gray-200 h-100 transition-all duration-200`}
              style={{
                borderRadius: '12px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-sm fw-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-2xl fw-bold text-gray-900 mb-0">{stat.value}</p>
                </div>
                <div className={stat.iconColor}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div 
        className="card p-4 mb-4 transition-all duration-200 position-relative"
        style={{ 
          borderRadius: '12px',
          boxShadow: 'none',
          border: 'none',
          overflow: 'visible'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div className="row g-3">
          <div className="col-12 col-md">
            <div className="position-relative">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Servis taleplerinde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control ps-5"
                style={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                aria-label="Servis taleplerinde ara"
              />
            </div>
          </div>
          <div className="col-12 col-md-auto">
            <div className="position-relative" ref={filterRef} style={{ zIndex: 1050 }}>
              <button 
                className={`btn-secondary w-100 w-md-auto d-flex align-items-center ${
                  showFilterDropdown ? 'border-primary' : ''
                }`}
                style={{ 
                  borderRadius: '8px',
                  border: showFilterDropdown ? '2px solid #2563eb' : undefined
                }}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                aria-label="Durum filtresi"
                aria-expanded={showFilterDropdown}
                aria-haspopup="true"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowFilterDropdown(false)
                  }
                }}
              >
                <Filter className="h-4 w-4 me-2" aria-hidden="true" />
                {statusFilter}
                <ChevronDown 
                  className={`h-4 w-4 ms-2 transition-transform ${
                    showFilterDropdown ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {showFilterDropdown && (
                <div 
                  className="position-absolute end-0 bg-white rounded-lg shadow-lg border border-gray-200"
                  style={{ 
                    minWidth: '200px',
                    borderRadius: '8px',
                    zIndex: 1051,
                    top: 'calc(100% + 8px)'
                  }}
                  role="menu"
                  aria-label="Durum filtre seçenekleri"
                >
                  <div className="py-1">
                    {filterOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setStatusFilter(option)
                          setShowFilterDropdown(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setStatusFilter(option)
                            setShowFilterDropdown(false)
                          } else if (e.key === 'Escape') {
                            setShowFilterDropdown(false)
                          }
                        }}
                        className={`w-100 text-start px-4 py-2 text-sm border-0 bg-transparent d-flex align-items-center ${
                          statusFilter === option
                            ? 'bg-primary bg-opacity-10 text-primary fw-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={{ 
                          transition: 'all 0.2s'
                        }}
                        role="menuitem"
                        aria-label={`${option} durumunu seç`}
                      >
                        {statusFilter === option && (
                          <CheckCircle className="h-4 w-4 me-2 text-primary" aria-hidden="true" />
                        )}
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg fw-semibold text-gray-900 mb-3">Servis Talepleri Listesi</h2>
        
        {isLoading ? (
          <div className="card text-center py-5" style={{ borderRadius: '12px' }}>
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <p className="text-sm text-gray-500 mb-0">Servis talepleri yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="card text-center py-5" style={{ borderRadius: '12px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2' }}>
            <AlertCircle className="h-12 w-12 text-red-500 mb-3 mx-auto" />
            <p className="text-sm fw-medium text-red-700 mb-2">{error}</p>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={loadServiceRequests}
              style={{ borderRadius: '8px' }}
            >
              Tekrar Dene
            </button>
          </div>
        ) : serviceRequests.length === 0 ? (
          <div 
            className="card transition-all duration-200"
            style={{ 
              borderRadius: '12px',
              border: 'none',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div className="d-flex flex-column align-items-center justify-content-center py-5 py-md-4 text-center">
              <Activity className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg fw-medium text-gray-900 mb-2">
                Henüz servis talebi yok
              </p>
              <p className="text-sm text-gray-500 mb-4 mb-md-5" style={{ maxWidth: '28rem' }}>
                İlk servis talebini oluşturmak için "Yeni Talep" butonuna tıklayın
              </p>
              <button 
                className="btn-primary"
                style={{ borderRadius: '8px' }}
                onClick={() => setShowNewRequestModal(true)}
              >
                <Plus className="h-4 w-4 me-2" />
                İlk Talebi Oluştur
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredServiceRequests.map((request) => (
              <div key={request.id} className="col-12 col-md-6 col-lg-4">
                  <div 
                    className="card h-100 p-4"
                    style={{ 
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <h4 className="text-lg fw-semibold text-gray-900 mb-1">{request.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{request.equipment}</p>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.375rem 0.625rem',
                              borderRadius: '6px',
                              fontWeight: '500',
                              border: `1px solid ${getPriorityBadgeColor(request.priority).borderColor}`,
                              backgroundColor: getPriorityBadgeColor(request.priority).backgroundColor,
                              color: getPriorityBadgeColor(request.priority).color
                            }}
                          >
                            {request.priority}
                          </span>
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.375rem 0.625rem',
                              borderRadius: '6px',
                              fontWeight: '500',
                              border: `1px solid ${getStatusBadgeColor(request.status).borderColor}`,
                              backgroundColor: getStatusBadgeColor(request.status).backgroundColor,
                              color: getStatusBadgeColor(request.status).color
                            }}
                          >
                            {request.status}
                          </span>
                        </div>
                        {request.location && (
                          <p className="text-xs text-gray-500 mb-1">
                            <MapPin className="h-3 w-3 d-inline me-1" />
                            {request.location}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mb-0">
                          <Calendar className="h-3 w-3 d-inline me-1" />
                          {request.date}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-3 pt-3 border-top border-gray-100">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="btn btn-sm btn-outline-primary flex-fill d-flex align-items-center justify-content-center gap-1"
                        style={{ borderRadius: '8px', fontSize: '0.875rem' }}
                        aria-label={`${request.title} servis talebini görüntüle`}
                      >
                        <Eye style={{ width: '16px', height: '16px' }} aria-hidden="true" />
                        Görüntüle
                      </button>
                      <button
                        onClick={() => handleEditRequest(request)}
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                        style={{ borderRadius: '8px', fontSize: '0.875rem', minWidth: '40px' }}
                        title="Düzenle"
                        aria-label={`${request.title} servis talebini düzenle`}
                      >
                        <Edit style={{ width: '16px', height: '16px' }} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowDeleteModal(true)
                        }}
                        className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                        style={{ borderRadius: '8px', fontSize: '0.875rem', minWidth: '40px' }}
                        title="Sil"
                        aria-label={`${request.title} servis talebini sil`}
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showNewRequestModal && (
        <div 
          className="modal-backdrop d-flex align-items-center justify-content-center"
          style={{ zIndex: 1060, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowNewRequestModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-request-modal-title"
        >
          <div 
            className="modal-content"
            style={{ 
              width: '90%', 
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              position: 'relative',
              zIndex: 1061
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowNewRequestModal(false)
              }
            }}
          >
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom border-gray-200">
              <h3 id="new-request-modal-title" className="text-lg fw-semibold text-gray-900 mb-0">Yeni Talep</h3>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="btn btn-link p-0 text-gray-400 border-0"
                aria-label="Modalı kapat"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4">
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                    Talep Başlığı
                  </label>
                  <input
                    type="text"
                    name="title"
                    className={`input ${formErrors.title ? 'border-danger' : ''}`}
                    placeholder="Talep başlığını girin"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      if (formErrors.title) {
                        const newErrors = { ...formErrors }
                        delete newErrors.title
                        setFormErrors(newErrors)
                      }
                    }}
                    onBlur={(e) => {
                      const validationResult = serviceRequestSchema.safeParse({
                        ...formData,
                        title: e.target.value,
                        checklist
                      })
                      if (!validationResult.success) {
                        const errors = formatZodError(validationResult.error)
                        if (errors.title) {
                          setFormErrors(prev => ({ ...prev, title: errors.title }))
                        }
                      }
                    }}
                    aria-label="Talep başlığı"
                    aria-invalid={!!formErrors.title}
                    aria-describedby={formErrors.title ? 'title-error' : undefined}
                  />
                  {formErrors.title && (
                    <p id="title-error" className="text-danger text-xs mt-1 mb-0" role="alert">{formErrors.title}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                    Ekipman
                  </label>
                  <input
                    type="text"
                    name="equipment"
                    className={`input ${formErrors.equipment ? 'border-danger' : ''}`}
                    placeholder="Ekipman adını girin"
                    value={formData.equipment}
                    onChange={(e) => {
                      setFormData({ ...formData, equipment: e.target.value })
                      if (formErrors.equipment) {
                        const newErrors = { ...formErrors }
                        delete newErrors.equipment
                        setFormErrors(newErrors)
                      }
                    }}
                    onBlur={(e) => {
                      const validationResult = serviceRequestSchema.safeParse({
                        ...formData,
                        equipment: e.target.value,
                        checklist
                      })
                      if (!validationResult.success) {
                        const errors = formatZodError(validationResult.error)
                        if (errors.equipment) {
                          setFormErrors(prev => ({ ...prev, equipment: errors.equipment }))
                        }
                      }
                    }}
                  />
                  {formErrors.equipment && (
                    <p className="text-danger text-xs mt-1 mb-0">{formErrors.equipment}</p>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                    Öncelik
                  </label>
                  <div className="position-relative" ref={priorityRef}>
                    <button
                      type="button"
                      className="input text-start d-flex align-items-center justify-content-between bg-white cursor-pointer"
                      onClick={() => {
                        setShowPriorityDropdown(!showPriorityDropdown)
                        setShowStatusDropdown(false)
                        setShowDatePicker(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowPriorityDropdown(false)
                        }
                      }}
                      style={{ 
                        border: showPriorityDropdown ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                      aria-label="Öncelik seç"
                      aria-expanded={showPriorityDropdown}
                      aria-haspopup="true"
                    >
                      <span className="text-gray-900">{formData.priority}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showPriorityDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {showPriorityDropdown && (
                      <div 
                        className="position-absolute start-0 w-100 bg-white rounded-lg shadow-lg border border-gray-200 mt-1"
                        style={{ 
                          zIndex: 1070, 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          top: '100%',
                          marginTop: '4px'
                        }}
                        role="menu"
                        aria-label="Öncelik seçenekleri"
                      >
                        <div className="py-1">
                          {priorityOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, priority: option })
                                setShowPriorityDropdown(false)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setFormData({ ...formData, priority: option })
                                  setShowPriorityDropdown(false)
                                } else if (e.key === 'Escape') {
                                  setShowPriorityDropdown(false)
                                }
                              }}
                              className={`w-100 text-start px-4 py-2.5 text-sm border-0 d-flex align-items-center transition-all duration-200 ${
                                formData.priority === option
                                  ? 'bg-blue-600 text-white fw-semibold'
                                  : 'bg-transparent text-gray-700 hover:bg-gray-100'
                              }`}
                              style={{ 
                                borderRadius: '8px',
                                margin: '2px 4px'
                              }}
                              role="menuitem"
                              aria-label={`${option} önceliğini seç`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                    Durum
                  </label>
                  <div className="position-relative" ref={statusRef}>
                    <button
                      type="button"
                      className="input text-start d-flex align-items-center justify-content-between bg-white cursor-pointer"
                      onClick={() => {
                        setShowStatusDropdown(!showStatusDropdown)
                        setShowPriorityDropdown(false)
                        setShowDatePicker(false)
                      }}
                      style={{ 
                        border: showStatusDropdown ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                    >
                      <span className="text-gray-900">{formData.status}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showStatusDropdown && (
                      <div 
                        className="position-absolute start-0 w-100 bg-white rounded-lg shadow-lg border border-gray-200 mt-1"
                        style={{ 
                          zIndex: 1070, 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          top: '100%',
                          marginTop: '4px'
                        }}
                      >
                        <div className="py-1">
                          {statusOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, status: option as 'Bekleyen' | 'Devam Eden' | 'Tamamlanan' | 'İptal Edilen' })
                                setShowStatusDropdown(false)
                              }}
                              className={`w-100 text-start px-4 py-2.5 text-sm border-0 d-flex align-items-center transition-all duration-200 ${
                                formData.status === option
                                  ? 'bg-blue-600 text-white fw-semibold'
                                  : 'bg-transparent text-gray-700 hover:bg-gray-100'
                              }`}
                              style={{ 
                                borderRadius: '8px',
                                margin: '2px 4px'
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                    Lokasyon
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Lokasyon girin"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    Tarih
                  </label>
                  <div className="position-relative" ref={dateRef}>
                    <button
                      type="button"
                      className="form-control text-start d-flex align-items-center justify-content-between bg-white"
                      onClick={() => {
                        setShowDatePicker(!showDatePicker)
                        setShowPriorityDropdown(false)
                        setShowStatusDropdown(false)
                      }}
                      style={{ 
                        borderRadius: '8px', 
                        border: showDatePicker ? '2px solid #f97316' : '1px solid #e5e7eb',
                        padding: '0.5rem 0.75rem',
                        minHeight: '38px'
                      }}
                    >
                      <span className="text-gray-900">{formatDate(selectedDate)}</span>
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </button>
                    {showDatePicker && (
                      <div 
                        className="position-absolute start-0 bg-white rounded-lg shadow-lg border border-gray-200 mt-1 p-2"
                        style={{ 
                          zIndex: 1052, 
                          borderRadius: '8px', 
                          width: '280px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, selectedDate.getDate()))}
                            className="btn btn-link p-1 border-0 text-gray-600 hover:text-gray-900"
                            style={{ minWidth: '28px', minHeight: '28px' }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="d-flex align-items-center gap-1">
                            <span className="fw-semibold text-gray-900" style={{ fontSize: '0.875rem' }}>
                              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                            </span>
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate()))}
                            className="btn btn-link p-1 border-0 text-gray-600 hover:text-gray-900"
                            style={{ minWidth: '28px', minHeight: '28px' }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="d-flex mb-1">
                          {dayNames.map((day) => (
                            <div 
                              key={day} 
                              className="flex-grow-1 text-center" 
                              style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: '500', 
                                color: '#6b7280', 
                                padding: '0.25rem 0',
                                width: 'calc(100% / 7)'
                              }}
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="d-flex flex-wrap">
                          {getDaysInMonth(selectedDate).map((dayInfo, index) => (
                            <div 
                              key={index} 
                              className="d-flex align-items-center justify-content-center"
                              style={{ 
                                width: 'calc(100% / 7)',
                                padding: '2px'
                              }}
                            >
                              {dayInfo.day !== null ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (dayInfo.isCurrentMonth) {
                                      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayInfo.day!)
                                      setSelectedDate(newDate)
                                      setFormData({ ...formData, date: formatDate(newDate) })
                                      setShowDatePicker(false)
                                    }
                                  }}
                                  className={`btn border-0 transition-colors d-flex align-items-center justify-content-center ${
                                    dayInfo.isSelected
                                      ? 'bg-primary text-white fw-semibold'
                                      : 'text-gray-900 hover:bg-gray-100 bg-white'
                                  }`}
                                  style={{ 
                                    borderRadius: '4px',
                                    width: '100%',
                                    height: '28px',
                                    fontSize: '0.75rem',
                                    padding: '0'
                                  }}
                                >
                                  {dayInfo.day}
                                </button>
                              ) : (
                                <div 
                                  style={{ 
                                    width: '100%',
                                    height: '28px'
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date()
                              setSelectedDate(today)
                              setFormData({ ...formData, date: formatDate(today) })
                              setShowDatePicker(false)
                            }}
                            className="btn btn-link p-0 text-primary text-xs text-decoration-none"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Bugün
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const defaultDate = new Date(2026, 0, 10)
                              setSelectedDate(defaultDate)
                              setFormData({ ...formData, date: '10.01.2026' })
                              setShowDatePicker(false)
                            }}
                            className="btn btn-link p-0 text-primary text-xs text-decoration-none"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Temizle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-lg fw-semibold text-gray-900 mb-2">
                  Esnek Endoskop Kontrol Listesi
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  (lütfen arızalı parçalara tik atın)
                </p>

                <div className="row g-4">
                  {Object.entries(checklist).map(([category, items]) => (
                    <div key={category} className="col-12 col-md-6 col-lg-4">
                      <div className="border rounded-lg p-3 h-100" style={{ borderRadius: '8px' }}>
                        <h5 className="text-sm fw-semibold text-gray-900 mb-3">{category}</h5>
                        <div className="d-flex flex-column gap-2">
                          {Object.entries(items).map(([item, checked]) => (
                            <div key={item} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setChecklist(prev => ({
                                    ...prev,
                                    [category]: {
                                      ...prev[category],
                                      [item]: e.target.checked
                                    }
                                  }))
                                }}
                                id={`${category}-${item}`}
                              />
                              <label 
                                className="form-check-label text-sm text-gray-700" 
                                htmlFor={`${category}-${item}`}
                              >
                                {item}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 p-5 border-top border-gray-200 bg-gray-50" style={{ borderRadius: '0 0 20px 20px' }}>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '12px', minWidth: '120px' }}
              >
                İptal
              </button>
              <Button
                onClick={handleCreateRequest}
                variant="primary"
                loading={isCreating}
                style={{ borderRadius: '12px', minWidth: '120px' }}
              >
                Oluştur
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedRequest && (
        <div 
          className="modal-backdrop d-flex align-items-center justify-content-center"
          style={{ zIndex: 1060, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="modal-content"
            style={{ 
              width: '90%', 
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              position: 'relative',
              zIndex: 1061
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom border-gray-200">
              <h3 className="text-lg fw-semibold text-gray-900 mb-0">Servis Talebi Detayları</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-link p-0 text-gray-400 border-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">Servis Talebi Başlığı</label>
                  <p className="text-sm text-gray-900 mb-0">{selectedRequest.title}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">Ekipman</label>
                  <p className="text-sm text-gray-900 mb-0">{selectedRequest.equipment}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">Öncelik</label>
                  <p className="mb-0">
                    <span 
                      className="badge" 
                      style={{ 
                        borderRadius: '6px', 
                        padding: '0.375rem 0.625rem', 
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: `1px solid ${getPriorityBadgeColor(selectedRequest.priority).borderColor}`,
                        backgroundColor: getPriorityBadgeColor(selectedRequest.priority).backgroundColor,
                        color: getPriorityBadgeColor(selectedRequest.priority).color
                      }}
                    >
                      {selectedRequest.priority}
                    </span>
                  </p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">Durum</label>
                  <p className="mb-0">
                    <span 
                      className="badge" 
                      style={{ 
                        borderRadius: '6px', 
                        padding: '0.375rem 0.625rem', 
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: `1px solid ${getStatusBadgeColor(selectedRequest.status).borderColor}`,
                        backgroundColor: getStatusBadgeColor(selectedRequest.status).backgroundColor,
                        color: getStatusBadgeColor(selectedRequest.status).color
                      }}
                    >
                      {selectedRequest.status}
                    </span>
                  </p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">Lokasyon</label>
                  <p className="text-sm text-gray-900 mb-0">{selectedRequest.location || '-'}</p>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-semibold text-gray-700 mb-2">Tarih</label>
                  <p className="text-sm text-gray-900 mb-0">{selectedRequest.date}</p>
                </div>
              </div>

              <div className="border-top border-gray-200 pt-4">
                <h4 className="text-lg fw-semibold text-gray-900 mb-2">Esnek Endoskop Kontrol Listesi</h4>
                <p className="text-sm text-gray-500 mb-4">
                  (lütfen arızalı parçalara tik atın)
                </p>
                <div className="row g-4">
                  {Object.entries(selectedRequest.checklist || {}).map(([category, items]: [string, ChecklistItem]) => {
                    const checkedItems = Object.entries(items).filter(([_, checked]) => checked)
                    return (
                      <div key={category} className="col-12 col-md-6 col-lg-4">
                        <div className="border rounded-lg p-3 h-100" style={{ borderRadius: '8px' }}>
                          <h5 className="text-sm fw-semibold text-gray-900 mb-3">{category}</h5>
                          {checkedItems.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                              {checkedItems.map(([item, _]) => (
                                <div key={item} className="d-flex align-items-center gap-2">
                                  <span className="text-success">✓</span>
                                  <span className="text-sm text-gray-700">{item}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 p-5 border-top border-gray-200 bg-gray-50" style={{ borderRadius: '0 0 12px 12px' }}>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '12px', minWidth: '120px' }}
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  handleEditRequest(selectedRequest)
                }}
                className="btn-primary"
                style={{ borderRadius: '12px', minWidth: '120px' }}
              >
                Düzenle
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedRequest && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1055
          }}
          onClick={() => {
            setShowEditModal(false)
            setSelectedRequest(null)
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg"
            style={{ 
              width: '90%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              position: 'relative',
              zIndex: 1061
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-gray-200">
              <h3 className="text-lg fw-semibold text-gray-900 mb-0">Servis Talebini Düzenle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedRequest(null)
                }}
                className="btn btn-link p-0 text-gray-400 border-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    Servis Talebi Başlığı
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Başlık girin"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    Ekipman
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ekipman adını girin"
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    Öncelik
                  </label>
                  <div className="position-relative" ref={priorityRef}>
                    <button
                      type="button"
                      className="form-control text-start d-flex align-items-center justify-content-between bg-white"
                      onClick={() => {
                        setShowPriorityDropdown(!showPriorityDropdown)
                        setShowStatusDropdown(false)
                        setShowDatePicker(false)
                      }}
                      style={{ 
                        borderRadius: '8px', 
                        border: showPriorityDropdown ? '2px solid #f97316' : '1px solid #e5e7eb',
                        padding: '0.5rem 0.75rem',
                        minHeight: '38px'
                      }}
                    >
                      <span className="text-gray-900">{formData.priority}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showPriorityDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showPriorityDropdown && (
                      <div 
                        className="position-absolute start-0 w-100 bg-white rounded-lg shadow-lg border border-gray-200"
                        style={{ 
                          zIndex: 1070, 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          top: '100%',
                          marginTop: '4px'
                        }}
                      >
                        <div className="py-1">
                          {priorityOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, priority: option })
                                setShowPriorityDropdown(false)
                              }}
                              className={`w-100 text-start px-4 py-2 text-sm border-0 d-flex align-items-center transition-colors ${
                                formData.priority === option
                                  ? 'bg-primary text-white fw-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    Durum
                  </label>
                  <div className="position-relative" ref={statusRef}>
                    <button
                      type="button"
                      className="form-control text-start d-flex align-items-center justify-content-between bg-white"
                      onClick={() => {
                        setShowStatusDropdown(!showStatusDropdown)
                        setShowPriorityDropdown(false)
                        setShowDatePicker(false)
                      }}
                      style={{ 
                        borderRadius: '8px', 
                        border: showStatusDropdown ? '2px solid #f97316' : '1px solid #e5e7eb',
                        padding: '0.5rem 0.75rem',
                        minHeight: '38px'
                      }}
                    >
                      <span className="text-gray-900">{formData.status}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showStatusDropdown && (
                      <div 
                        className="position-absolute start-0 w-100 bg-white rounded-lg shadow-lg border border-gray-200"
                        style={{ 
                          zIndex: 1070, 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          top: '100%',
                          marginTop: '4px'
                        }}
                      >
                        <div className="py-1">
                          {statusOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, status: option as 'Bekleyen' | 'Devam Eden' | 'Tamamlanan' | 'İptal Edilen' })
                                setShowStatusDropdown(false)
                              }}
                              className={`w-100 text-start px-4 py-2 text-sm border-0 d-flex align-items-center transition-colors ${
                                formData.status === option
                                  ? 'bg-primary text-white fw-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    Lokasyon
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Lokasyon girin"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700">
                    Tarih
                  </label>
                  <div className="position-relative" ref={dateRef}>
                    <button
                      type="button"
                      className="form-control text-start d-flex align-items-center justify-content-between bg-white"
                      onClick={() => {
                        setShowDatePicker(!showDatePicker)
                        setShowPriorityDropdown(false)
                        setShowStatusDropdown(false)
                      }}
                      style={{ 
                        borderRadius: '8px', 
                        border: showDatePicker ? '2px solid #f97316' : '1px solid #e5e7eb',
                        padding: '0.5rem 0.75rem',
                        minHeight: '38px'
                      }}
                    >
                      <span className="text-gray-900">{formData.date}</span>
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </button>
                    {showDatePicker && (
                      <div 
                        className="position-absolute start-0 bg-white rounded-lg shadow-lg border border-gray-200 mt-1 p-3"
                        style={{ 
                          zIndex: 1052, 
                          borderRadius: '8px',
                          minWidth: '280px'
                        }}
                      >
                        <div className="mb-2">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newDate = new Date(selectedDate)
                                newDate.setMonth(newDate.getMonth() - 1)
                                setSelectedDate(newDate)
                              }}
                              className="btn btn-link p-1 text-gray-600 border-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-sm fw-semibold text-gray-900">
                                {selectedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                              </span>
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newDate = new Date(selectedDate)
                                newDate.setMonth(newDate.getMonth() + 1)
                                setSelectedDate(newDate)
                              }}
                              className="btn btn-link p-1 text-gray-600 border-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="d-flex mb-1">
                            {dayNames.map((day) => (
                              <div 
                                key={day} 
                                className="flex-grow-1 text-center" 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  fontWeight: '500', 
                                  color: '#6b7280', 
                                  padding: '0.25rem 0',
                                  width: 'calc(100% / 7)'
                                }}
                              >
                                {day}
                              </div>
                            ))}
                          </div>
                          <div className="d-flex flex-wrap">
                            {getDaysInMonth(selectedDate).map((dayInfo, index) => (
                              <div 
                                key={index} 
                                className="d-flex align-items-center justify-content-center"
                                style={{ 
                                  width: 'calc(100% / 7)',
                                  padding: '2px'
                                }}
                              >
                                {dayInfo.day !== null ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (dayInfo.isCurrentMonth) {
                                        const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayInfo.day!)
                                        setSelectedDate(newDate)
                                        setFormData({ ...formData, date: formatDate(newDate) })
                                        setShowDatePicker(false)
                                      }
                                    }}
                                    className={`btn border-0 transition-colors d-flex align-items-center justify-content-center ${
                                      dayInfo.isSelected
                                        ? 'bg-primary text-white fw-semibold'
                                        : 'text-gray-900 hover:bg-gray-100 bg-white'
                                    }`}
                                    style={{ 
                                      borderRadius: '4px',
                                      width: '100%',
                                      height: '28px',
                                      fontSize: '0.75rem',
                                      padding: '0'
                                    }}
                                  >
                                    {dayInfo.day}
                                  </button>
                                ) : (
                                  <div 
                                    style={{ 
                                      width: '100%',
                                      height: '28px'
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="d-flex justify-content-between mt-2 pt-2 border-top border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                const today = new Date()
                                setSelectedDate(today)
                                setFormData({ ...formData, date: formatDate(today) })
                                setShowDatePicker(false)
                              }}
                              className="btn btn-link p-0 text-primary text-xs text-decoration-none"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Bugün
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, date: '' })
                                setShowDatePicker(false)
                              }}
                              className="btn btn-link p-0 text-primary text-xs text-decoration-none"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Temizle
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-lg fw-semibold text-gray-900 mb-2">
                  Esnek Endoskop Kontrol Listesi
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  (lütfen arızalı parçalara tik atın)
                </p>

                <div className="row g-4">
                  {Object.entries(checklist).map(([category, items]) => (
                    <div key={category} className="col-12 col-md-6 col-lg-4">
                      <div className="border rounded-lg p-3 h-100" style={{ borderRadius: '8px' }}>
                        <h5 className="text-sm fw-semibold text-gray-900 mb-3">{category}</h5>
                        <div className="d-flex flex-column gap-2">
                          {Object.entries(items).map(([item, checked]) => (
                            <div key={item} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setChecklist(prev => ({
                                    ...prev,
                                    [category]: {
                                      ...prev[category],
                                      [item]: e.target.checked
                                    }
                                  }))
                                }}
                                id={`edit-${category}-${item}`}
                              />
                              <label 
                                className="form-check-label text-sm text-gray-700" 
                                htmlFor={`edit-${category}-${item}`}
                              >
                                {item}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 p-4 border-top border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedRequest(null)
                }}
                className="btn btn-outline-secondary"
                style={{ borderRadius: '8px' }}
              >
                İptal
              </button>
              <Button
                onClick={handleUpdateRequest}
                variant="primary"
                loading={isUpdating}
                style={{ borderRadius: '8px' }}
              >
                Güncelle
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedRequest && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1055
          }}
          onClick={() => {
            setShowDeleteModal(false)
            setSelectedRequest(null)
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg"
            style={{ 
              width: '90%',
              maxWidth: '400px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              position: 'relative',
              zIndex: 1061
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-gray-200">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle bg-blue-100 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg fw-semibold text-gray-900 mb-0">Servis Talebini Sil</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedRequest(null)
                }}
                className="btn btn-link p-0 text-gray-400 border-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-700 mb-0">
                Bu servis talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>

            <div className="d-flex justify-content-end gap-3 p-4 border-top border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedRequest(null)
                }}
                className="btn btn-outline-secondary"
                style={{ borderRadius: '8px' }}
              >
                İptal
              </button>
              <Button
                onClick={handleDeleteRequest}
                variant="danger"
                loading={isDeleting}
                style={{ borderRadius: '8px' }}
              >
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
