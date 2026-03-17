'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock, X, ChevronDown, AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import { appointmentSchema, formatZodError, type AppointmentFormData } from '@/lib/validation'
import Button from '@/components/Button'
import { useToast } from '@/components/ToastContext'
import { formatDate } from '@/lib/utils'
import { fetchAppointments, createAppointment, updateAppointment, deleteAppointment } from '@/lib/api'
import type { Appointment } from '@/lib/types'

export default function Appointments() {
  const { showSuccess, showError } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 10))
  const [hoveredDate, setHoveredDate] = useState<number | null>(null)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const durationRef = useRef<HTMLDivElement>(null)
  const typeRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  const [appointmentData, setAppointmentData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '1 saat',
    type: 'Bakım',
    equipment: '',
    notes: ''
  })

  const durationOptions = ['30 dakika', '1 saat', '2 saat', '3 saat', '4 saat', 'Yarım gün', 'Tam gün']
  const typeOptions = ['Bakım', 'Onarım', 'Kontrol', 'Kalibrasyon', 'Diğer']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days = []
    
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ 
        day: prevMonthDays - i, 
        isCurrentMonth: false, 
        isSelected: false 
      })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i)
      days.push({ 
        day: i, 
        isCurrentMonth: true, 
        isSelected: dayDate.toDateString() === selectedDate.toDateString()
      })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, isSelected: false })
    }

    return days
  }


  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchAppointments()
      if (Array.isArray(data)) {
        setAppointments(data)
      } else {
        setAppointments([])
      }
    } catch (error) {
      logger.error('Error loading appointments:', error)
      const errorMessage = 'Randevular yüklenirken bir hata oluştu'
      setError(errorMessage)
      showError(errorMessage)
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
        setShowDurationDropdown(false)
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      const newSelectedDate = new Date(newDate)
      newSelectedDate.setDate(selectedDate.getDate())
      if (newSelectedDate.getMonth() === newDate.getMonth()) {
        setSelectedDate(newSelectedDate)
      }
      return newDate
    })
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
    setAppointmentData({
      ...appointmentData,
      date: formatDate(clickedDate)
    })
    setShowNewAppointmentModal(true)
  }

  const handleCreateAppointment = async () => {
    if (isCreating) return
    
    try {
      setIsCreating(true)
      
      const validationResult = appointmentSchema.safeParse(appointmentData)

      if (!validationResult.success) {
        const errors = formatZodError(validationResult.error)
        logger.warn('Form validation errors:', errors)
        setFormErrors(errors)
        const firstErrorField = Object.keys(errors)[0]
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          ;(errorElement as HTMLElement).focus()
        }
        return
      }

      setFormErrors({})

      const validatedData = validationResult.data

      if (editingAppointment) {
        await updateAppointment(editingAppointment.id.toString(), {
          ...validatedData
        })
        showSuccess('Randevu başarıyla güncellendi')
      } else {
        await createAppointment({
          ...validatedData
        })
        showSuccess('Randevu başarıyla oluşturuldu')
      }
      
      await loadAppointments()
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointmentChanged'))
      }
      
      setShowNewAppointmentModal(false)
      setEditingAppointment(null)
      setAppointmentData({
        title: '',
        date: '',
        time: '',
        duration: '1 saat',
        type: 'Bakım',
        equipment: '',
        notes: ''
      })
      setFormErrors({})
    } catch (error) {
      logger.error('Error creating appointment:', error)
      showError('Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsCreating(false)
    }
  }

  const calendarDays = getDaysInMonth(currentDate)
  const currentMonth = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
        <div className="mb-3 mb-sm-0">
          <h1 className="text-3xl font-bold text-gray-900">Servis Takvimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Servis ve bakım planlaması
          </p>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          <button className="btn-secondary" style={{ borderRadius: '8px' }}>
            <Calendar className="h-4 w-4 me-2" />
            Bugünkü Randevular
          </button>
          <button 
            className="btn-primary" 
            style={{ borderRadius: '8px' }}
            onClick={() => {
              setAppointmentData({
                ...appointmentData,
                date: formatDate(selectedDate)
              })
              setShowNewAppointmentModal(true)
            }}
          >
            <Plus className="h-4 w-4 me-2" />
            Yeni Randevu
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div 
            className="card h-100 transition-all" 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="p-4 p-md-5">
              
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="flex-grow-1">
                  <h3 className="text-lg fw-semibold text-gray-900 mb-0">Takvim</h3>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="btn btn-link p-2 text-gray-600 hover:bg-gray-100 rounded-lg border-0 transition-all"
                    type="button"
                    style={{ 
                      borderRadius: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h4 className="text-lg fw-semibold text-gray-900 mb-0" style={{ minWidth: '120px', textAlign: 'center' }}>
                    {currentMonth} {currentYear}
                  </h4>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="btn btn-link p-2 text-gray-600 hover:bg-gray-100 rounded-lg border-0 transition-all"
                    type="button"
                    style={{ 
                      borderRadius: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="d-flex mb-3">
                {dayNames.map((day) => (
                  <div 
                    key={day} 
                    className="flex-grow-1 text-center text-sm fw-medium text-gray-600 py-2"
                    style={{ 
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      width: 'calc(100% / 7)',
                      color: '#6b7280'
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="d-flex flex-wrap">
                {calendarDays.map((dayInfo, index) => {
                  const isHovered = hoveredDate === dayInfo.day && dayInfo.isCurrentMonth
                  const isSelected = dayInfo.isSelected
                  
                  return (
                    <div
                      key={index}
                      className="d-flex align-items-center justify-content-center"
                      style={{ 
                        width: 'calc(100% / 7)',
                        padding: '6px'
                      }}
                    >
                      {dayInfo.day !== null ? (
                        <button
                          type="button"
                        onClick={() => {
                          if (dayInfo.isCurrentMonth) {
                            handleDateClick(dayInfo.day!)
                          }
                        }}
                          onMouseEnter={() => {
                            if (dayInfo.isCurrentMonth) {
                              setHoveredDate(dayInfo.day!)
                            }
                          }}
                          onMouseLeave={() => setHoveredDate(null)}
                          className={`btn border-0 d-flex align-items-center justify-content-center position-relative ${
                            isSelected
                              ? 'text-white fw-semibold'
                              : dayInfo.isCurrentMonth
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          style={{ 
                            width: '100%',
                            height: '44px',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            padding: '0',
                            backgroundColor: isSelected 
                              ? '#2563eb' 
                              : isHovered 
                                ? '#e5e7eb' 
                                : dayInfo.isCurrentMonth 
                                  ? 'transparent' 
                                  : 'transparent',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isHovered && !isSelected ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: isSelected 
                              ? '0 2px 8px rgba(37, 99, 235, 0.3)' 
                              : isHovered 
                                ? '0 2px 4px rgba(0, 0, 0, 0.1)' 
                                : 'none'
                          }}
                        >
                          {dayInfo.day}
                        </button>
                      ) : (
                        <div style={{ width: '100%', height: '44px' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card h-100" style={{ borderRadius: '12px' }}>
            <div className="p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-lg fw-semibold text-gray-900 mb-0">Tüm Randevular</h3>
                <span className="text-sm text-gray-500">{appointments.length} randevu</span>
              </div>

              {isLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                  <p className="text-sm fw-medium text-red-700 mb-2">{error}</p>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={loadAppointments}
                    style={{ borderRadius: '8px' }}
                  >
                    Tekrar Dene
                  </button>
                </div>
              ) : appointments.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-sm fw-medium text-gray-900 mb-2">
                    Henüz randevu oluşturulmamış
                  </p>
                  <button 
                    className="btn-primary mt-3" 
                    style={{ borderRadius: '8px' }}
                    onClick={() => {
                      setAppointmentData({
                        ...appointmentData,
                        date: formatDate(selectedDate)
                      })
                      setShowNewAppointmentModal(true)
                    }}
                  >
                    Randevu Ekle
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {appointments.map((appointment) => (
                    <div 
                      key={appointment.id}
                      className="card p-3 border-0"
                      style={{ 
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}
                      onClick={() => {
                        setEditingAppointment(appointment)
                        setAppointmentData({
                          title: appointment.title,
                          date: appointment.date,
                          time: appointment.time,
                          duration: appointment.duration,
                          type: appointment.type,
                          equipment: appointment.equipment || '',
                          notes: appointment.notes || ''
                        })
                        setShowNewAppointmentModal(true)
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h4 className="text-sm fw-semibold text-gray-900 mb-0">{appointment.title}</h4>
                        <button
                          className="btn btn-link p-0 text-danger"
                          style={{ fontSize: '0.75rem' }}
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
                              try {
                                const deleteId = appointment.id
                                setAppointments(prev => prev.filter(a => a.id !== deleteId))
                                
                                await deleteAppointment(deleteId.toString())
                                showSuccess('Randevu başarıyla silindi')
                                
                                await loadAppointments()
                                
                                if (typeof window !== 'undefined') {
                                  window.dispatchEvent(new CustomEvent('appointmentChanged'))
                                }
                              } catch (error) {
                                showError('Randevu silinirken bir hata oluştu')
                                await loadAppointments()
                              }
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="d-flex align-items-center gap-2 text-xs text-gray-600 mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>{appointment.date}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 text-xs text-gray-600 mb-1">
                        <Clock className="h-3 w-3" />
                        <span>{appointment.time} - {appointment.duration}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="badge bg-primary">{appointment.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showNewAppointmentModal && (
        <div 
          className="modal-backdrop d-flex align-items-center justify-content-center"
          style={{ zIndex: 1060, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => {
            setShowNewAppointmentModal(false)
            setEditingAppointment(null)
            setAppointmentData({
              title: '',
              date: '',
              time: '',
              duration: '1 saat',
              type: 'Bakım',
              equipment: '',
              notes: ''
            })
          }}
        >
          <div 
            className="modal-content"
            style={{ 
              width: '90%',
              maxWidth: '600px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              position: 'relative',
              zIndex: 1061
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-gray-200">
              <h3 className="text-lg fw-semibold text-gray-900 mb-0">Yeni Randevu Oluştur</h3>
              <button
                onClick={() => setShowNewAppointmentModal(false)}
                className="btn btn-link p-0 text-gray-400 border-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Başlık
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Randevu başlığı"
                    value={appointmentData.title}
                    onChange={(e) => setAppointmentData({ ...appointmentData, title: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Tarih
                  </label>
                  <div className="position-relative" ref={dateRef}>
                    <input
                      type="text"
                      className="form-control pe-5"
                      placeholder="Tarih seçin"
                      value={appointmentData.date}
                      readOnly
                      onClick={() => {
                        setShowDatePicker(!showDatePicker)
                        setShowDurationDropdown(false)
                        setShowTypeDropdown(false)
                      }}
                      style={{ borderRadius: '8px', cursor: 'pointer' }}
                    />
                    <Calendar className="position-absolute top-50 end-0 translate-middle-y me-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    
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
                                const newDate = new Date(currentDate)
                                newDate.setMonth(newDate.getMonth() - 1)
                                setCurrentDate(newDate)
                              }}
                              className="btn btn-link p-1 text-gray-600 border-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-sm fw-semibold text-gray-900">
                                {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                              </span>
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newDate = new Date(currentDate)
                                newDate.setMonth(newDate.getMonth() + 1)
                                setCurrentDate(newDate)
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
                            {getDaysInMonth(currentDate).map((dayInfo, index) => (
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
                                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayInfo.day!)
                                        setSelectedDate(newDate)
                                        setAppointmentData({ ...appointmentData, date: formatDate(newDate) })
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
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Saat
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    placeholder="--:--"
                    value={appointmentData.time}
                    onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Süre (Dakika)
                  </label>
                  <div className="position-relative" ref={durationRef}>
                    <button
                      type="button"
                      className="form-control text-start d-flex align-items-center justify-content-between bg-white"
                      onClick={() => {
                        setShowDurationDropdown(!showDurationDropdown)
                        setShowTypeDropdown(false)
                        setShowDatePicker(false)
                      }}
                      style={{ 
                        borderRadius: '8px', 
                        border: showDurationDropdown ? '2px solid #f97316' : '1px solid #e5e7eb',
                        padding: '0.5rem 0.75rem',
                        minHeight: '38px'
                      }}
                    >
                      <span className="text-gray-900">{appointmentData.duration}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDurationDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showDurationDropdown && (
                      <div 
                        className="position-absolute start-0 w-100 bg-white rounded-lg shadow-lg border border-gray-200 mt-1"
                        style={{ 
                          zIndex: 1052, 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <div className="py-1">
                          {durationOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setAppointmentData({ ...appointmentData, duration: option })
                                setShowDurationDropdown(false)
                              }}
                              className={`w-100 text-start px-4 py-2 text-sm border-0 d-flex align-items-center transition-colors ${
                                appointmentData.duration === option
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

                <div className="col-12">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Tür
                  </label>
                  <div className="position-relative" ref={typeRef}>
                    <button
                      type="button"
                      className="form-control text-start d-flex align-items-center justify-content-between bg-white"
                      onClick={() => {
                        setShowTypeDropdown(!showTypeDropdown)
                        setShowDurationDropdown(false)
                        setShowDatePicker(false)
                      }}
                      style={{ 
                        borderRadius: '8px', 
                        border: showTypeDropdown ? '2px solid #f97316' : '1px solid #e5e7eb',
                        padding: '0.5rem 0.75rem',
                        minHeight: '38px'
                      }}
                    >
                      <span className="text-gray-900">{appointmentData.type}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showTypeDropdown && (
                      <div 
                        className="position-absolute start-0 w-100 bg-white rounded-lg shadow-lg border border-gray-200 mt-1"
                        style={{ 
                          zIndex: 1052, 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <div className="py-1">
                          {typeOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setAppointmentData({ ...appointmentData, type: option })
                                setShowTypeDropdown(false)
                              }}
                              className={`w-100 text-start px-4 py-2 text-sm border-0 d-flex align-items-center transition-colors ${
                                appointmentData.type === option
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

                <div className="col-12">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Ekipman
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ekipman adı"
                    value={appointmentData.equipment}
                    onChange={(e) => setAppointmentData({ ...appointmentData, equipment: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    className="form-control"
                    placeholder="Ek notlar"
                    rows={4}
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                    style={{ borderRadius: '8px', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 p-5 border-top border-gray-200 bg-gray-50" style={{ borderRadius: '0 0 20px 20px' }}>
              <button
                onClick={() => setShowNewAppointmentModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '12px', minWidth: '120px' }}
              >
                İptal
              </button>
              <Button
                onClick={handleCreateAppointment}
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
    </div>
  )
}
