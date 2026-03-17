'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, BarChart3, X, Calendar, ChevronLeft, ChevronRight, ChevronDown, Download, Printer, Edit, Trash2, AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import { useToast } from '@/components/ToastContext'
import { formatDate } from '@/lib/utils'
import { fetchReports, createReport, updateReport, deleteReport } from '@/lib/api'
import type { Report } from '@/lib/types'

export default function Reports() {
  const { showSuccess, showError } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [showNewReportModal, setShowNewReportModal] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 10))
  const dateRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const dayNames = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']

  const brandOptions = ['Marka', 'Olympus', 'Pentax', 'Fujinon']

  const [reportData, setReportData] = useState({
    reportNo: '0102',
    date: '10.01.2026',
    companyName: '',
    authorizedPerson: '',
    contact: '',
    address: '',
    brand: 'Marka',
    model: '',
    serialNo: '',
    description: '',
    deliveredBy: '',
    deliveredTo: '',
    status: 'Hazırlanıyor'
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
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchReports()
      if (Array.isArray(data)) {
        setReports(data)
      } else {
        setReports([])
      }
    } catch (error) {
      logger.error('Error loading reports:', error)
      const errorMessage = 'Raporlar yüklenirken bir hata oluştu'
      setError(errorMessage)
      showError(errorMessage)
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSaveReport = async () => {
    try {
      if (editingReport) {
        await updateReport(editingReport.id.toString(), {
          ...reportData,
          checklist
        })
        showSuccess('Rapor başarıyla güncellendi')
      } else {
        await createReport({
          ...reportData,
          checklist
        })
        showSuccess('Rapor başarıyla kaydedildi')
      }

      await loadReports()
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reportChanged'))
      }
      
      setShowNewReportModal(false)
      setEditingReport(null)
      setReportData({
        reportNo: '',
        date: formatDate(new Date()),
        companyName: '',
        authorizedPerson: '',
        contact: '',
        address: '',
        brand: 'Marka',
        model: '',
        serialNo: '',
        description: '',
        deliveredBy: '',
        deliveredTo: '',
        status: 'Hazırlanıyor'
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
    } catch (error) {
      logger.error('Error saving report:', error)
      showError('Rapor kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
        <div className="mb-3 mb-sm-0">
          <h1 className="text-3xl font-bold text-gray-900">Raporlar & Analiz</h1>
          <p className="mt-1 text-sm text-gray-500">
            Performans raporları ve analitik veriler
          </p>
        </div>
        <button 
          className="btn-primary" 
          style={{ borderRadius: '8px' }}
          onClick={() => {
            setEditingReport(null)
            setReportData({
              reportNo: '',
              date: formatDate(new Date()),
              companyName: '',
              authorizedPerson: '',
              contact: '',
              address: '',
              brand: 'Marka',
              model: '',
              serialNo: '',
              description: '',
              deliveredBy: '',
              deliveredTo: '',
              status: 'Hazırlanıyor'
            })
            setShowNewReportModal(true)
          }}
        >
          <Plus className="h-4 w-4 me-2" />
          Yeni Rapor
        </button>
      </div>

      {isLoading ? (
        <div className="card p-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      ) : error ? (
        <div className="card text-center py-5" style={{ borderRadius: '12px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2' }}>
          <AlertCircle className="h-12 w-12 text-red-500 mb-3 mx-auto" />
          <p className="text-sm fw-medium text-red-700 mb-2">{error}</p>
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={loadReports}
            style={{ borderRadius: '8px' }}
          >
            Tekrar Dene
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div 
          className="card transition-all duration-200"
          style={{ 
            borderRadius: '12px',
            border: 'none',
            boxShadow: 'none'
          }}
        >
          <div className="d-flex flex-column align-items-center justify-content-center py-5 py-md-5 text-center">
            <BarChart3 className="h-20 w-20 text-gray-400 mb-4 mb-md-5" />
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Henüz rapor yok
            </p>
            <p className="text-sm text-gray-500 mb-4 mb-md-5" style={{ maxWidth: '28rem' }}>
              İlk raporu oluşturmak için "Yeni Rapor" butonuna tıklayın
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {reports.map((report) => (
            <div key={report.id} className="col-12 col-md-6 col-lg-4">
              <div 
                className="card h-100 p-4"
                style={{ 
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h4 className="text-lg fw-semibold text-gray-900 mb-1">Rapor #{report.reportNo}</h4>
                    <p className="text-sm text-gray-600 mb-0">{report.companyName}</p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-link p-1 text-primary"
                      onClick={() => {
                        setEditingReport(report)
                        setReportData({
                          reportNo: report.reportNo,
                          date: report.date,
                          companyName: report.companyName,
                          authorizedPerson: report.authorizedPerson,
                          contact: report.contact,
                          address: report.address,
                          brand: report.brand,
                          model: report.model,
                          serialNo: report.serialNo,
                          description: report.description,
                          deliveredBy: report.deliveredBy,
                          deliveredTo: report.deliveredTo,
                          status: report.status
                        })
                        setChecklist(report.checklist || {})
                        setShowNewReportModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="btn btn-link p-1 text-danger"
                      onClick={async () => {
                        if (confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
                          try {
                            const deleteId = report.id
                            setReports(prev => prev.filter(r => r.id !== deleteId))
                            
                            await deleteReport(deleteId.toString())
                            showSuccess('Rapor başarıyla silindi')
                            
                            await loadReports()
                            
                            if (typeof window !== 'undefined') {
                              window.dispatchEvent(new CustomEvent('reportChanged'))
                            }
                          } catch (error) {
                            showError('Rapor silinirken bir hata oluştu')
                            await loadReports()
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 text-xs text-gray-600 mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>{report.date}</span>
                </div>
                <div className="mb-2">
                  <span className={`badge ${
                    report.status === 'Gönderildi' ? 'bg-success' :
                    report.status === 'Hazırlanıyor' ? 'bg-warning' :
                    report.status === 'Hazır' ? 'bg-info' :
                    'bg-secondary'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-sm btn-outline-primary">
                    <Download className="h-3 w-3 me-1" />
                    İndir
                  </button>
                  <button className="btn btn-sm btn-outline-secondary">
                    <Printer className="h-3 w-3 me-1" />
                    Yazdır
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewReportModal && (
        <div 
          className="modal-backdrop d-flex align-items-center justify-content-center"
          style={{ zIndex: 1060, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowNewReportModal(false)}
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
            <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-gray-200">
              <h3 className="text-lg fw-semibold text-gray-900 mb-0">Servis Raporu</h3>
              <button
                onClick={() => setShowNewReportModal(false)}
                className="btn btn-link p-0 text-gray-400 border-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Rapor No
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={reportData.reportNo}
                    onChange={(e) => setReportData({ ...reportData, reportNo: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    Tarih
                  </label>
                  <div className="position-relative" ref={dateRef}>
                    <input
                      type="text"
                      className="form-control pe-5"
                      value={reportData.date}
                      readOnly
                      onClick={() => setShowDatePicker(!showDatePicker)}
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
                                        setReportData({ ...reportData, date: formatDate(newDate) })
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
              </div>

              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6">
                  <h4 className="text-md fw-semibold text-gray-900 mb-3">MÜŞTERİ BİLGİSİ</h4>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                        Firma Adı
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Firma Adı"
                        value={reportData.companyName}
                        onChange={(e) => setReportData({ ...reportData, companyName: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                        Yetkili
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Yetkili"
                        value={reportData.authorizedPerson}
                        onChange={(e) => setReportData({ ...reportData, authorizedPerson: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                        İletişim
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="İletişim"
                        value={reportData.contact}
                        onChange={(e) => setReportData({ ...reportData, contact: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                        Adres
                      </label>
                      <textarea
                        className="form-control"
                        placeholder="Adres"
                        rows={3}
                        value={reportData.address}
                        onChange={(e) => setReportData({ ...reportData, address: e.target.value })}
                        style={{ borderRadius: '8px', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <h4 className="text-md fw-semibold text-gray-900 mb-3">CİHAZ BİLGİSİ</h4>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                        Marka
                      </label>
                      <div className="position-relative" ref={brandRef}>
                        <button
                          type="button"
                          className="form-control text-start d-flex align-items-center justify-content-between bg-white"
                          onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                          style={{ 
                            borderRadius: '8px', 
                            border: showBrandDropdown ? '2px solid #f97316' : '1px solid #e5e7eb',
                            padding: '0.5rem 0.75rem',
                            minHeight: '38px'
                          }}
                        >
                          <span className="text-gray-900">{reportData.brand}</span>
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showBrandDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showBrandDropdown && (
                          <div 
                            className="position-absolute start-0 w-100 bg-white rounded-lg shadow-lg border border-gray-200 mt-1"
                            style={{ 
                              zIndex: 1052, 
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                          >
                            <div className="py-1">
                              {brandOptions.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => {
                                    setReportData({ ...reportData, brand: option })
                                    setShowBrandDropdown(false)
                                  }}
                                  className={`w-100 text-start px-4 py-2 text-sm border-0 d-flex align-items-center transition-colors ${
                                    reportData.brand === option
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
                    <div>
                      <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Model"
                        value={reportData.model}
                        onChange={(e) => setReportData({ ...reportData, model: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                        Seri No
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Seri No"
                        value={reportData.serialNo}
                        onChange={(e) => setReportData({ ...reportData, serialNo: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                  AÇIKLAMA
                </label>
                <textarea
                  className="form-control"
                  placeholder="AÇIKLAMA"
                  rows={4}
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  style={{ borderRadius: '8px', resize: 'vertical' }}
                />
              </div>

              <div className="mb-4">
                <h4 className="text-md fw-semibold text-gray-900 mb-2">
                  Esnek Endoskop (lütfen arızalı parçalara tik atın)
                </h4>
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

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    TESLİM ALAN
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="TESLİM ALAN"
                    value={reportData.deliveredTo}
                    onChange={(e) => setReportData({ ...reportData, deliveredTo: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-sm fw-medium text-gray-700 mb-2">
                    TESLİM EDEN
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="TESLİM EDEN"
                    value={reportData.deliveredBy}
                    onChange={(e) => setReportData({ ...reportData, deliveredBy: e.target.value })}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-sm fw-medium text-gray-700 mb-3 d-block">
                  Rapor Durumu
                </label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportStatus"
                      id="preparing"
                      checked={reportData.status === 'Hazırlanıyor'}
                      onChange={() => setReportData({ ...reportData, status: 'Hazırlanıyor' })}
                    />
                    <label className="form-check-label text-sm text-gray-700" htmlFor="preparing">
                      Hazırlanıyor
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportStatus"
                      id="completed"
                      checked={reportData.status === 'Tamamlandı'}
                      onChange={() => setReportData({ ...reportData, status: 'Tamamlandı' })}
                    />
                    <label className="form-check-label text-sm text-gray-700" htmlFor="completed">
                      Tamamlandı
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center p-4 border-top border-gray-200">
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary d-flex align-items-center gap-2" style={{ borderRadius: '8px' }}>
                  <Download className="h-4 w-4" />
                  PDF Olarak Dışa Aktar
                </button>
                <button className="btn btn-outline-primary d-flex align-items-center gap-2" style={{ borderRadius: '8px' }}>
                  <Printer className="h-4 w-4" />
                  Yazdır
                </button>
              </div>
              <div className="d-flex gap-3">
                <button
                  onClick={() => setShowNewReportModal(false)}
                  className="btn-secondary"
                  style={{ borderRadius: '12px', minWidth: '120px' }}
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveReport}
                  className="btn-primary"
                  style={{ borderRadius: '12px', minWidth: '120px' }}
                >
                  Raporu Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
