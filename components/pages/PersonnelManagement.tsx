'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Users, Edit, Trash2, X, AlertCircle } from 'lucide-react'
import { Personnel } from '@/lib/types'
import { personnelSchema, formatZodError, type PersonnelFormData } from '@/lib/validation'
import { logger } from '@/lib/logger'
import Button from '@/components/Button'
import { useToast } from '@/components/ToastContext'
import { fetchPersonnel, createPersonnel, updatePersonnel, deletePersonnel } from '@/lib/api'

export default function PersonnelManagement() {
  const { showSuccess, showError } = useToast()
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false)
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null)
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [newPersonnel, setNewPersonnel] = useState({
    name: '',
    role: '',
    email: '',
    phone: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadPersonnel = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchPersonnel()
        setPersonnel(data)
      } catch (error) {
        logger.error('Error loading personnel:', error)
        const errorMessage = 'Personel listesi yüklenirken bir hata oluştu'
        setError(errorMessage)
        showError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }
    loadPersonnel()
  }, [])

  const handleSavePersonnel = async () => {
    if (isSaving) return
    
    try {
      setIsSaving(true)
      
      const validationResult = personnelSchema.safeParse(newPersonnel)

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

      if (editingPersonnel) {
        const updated = await updatePersonnel(editingPersonnel.id.toString(), validatedData)
        setPersonnel(personnel.map(p => p.id === editingPersonnel.id ? { ...p, ...updated } : p))
      } else {
        const created = await createPersonnel(validatedData)
        setPersonnel([...personnel, created])
      }
      setNewPersonnel({ name: '', role: '', email: '', phone: '' })
      setEditingPersonnel(null)
      setShowAddPersonnelModal(false)
      setFormErrors({})
      showSuccess(editingPersonnel ? 'Personel başarıyla güncellendi' : 'Personel başarıyla eklendi')
    } catch (error) {
      logger.error('Error saving personnel:', error)
      showError('Personel kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3">
        <div className="mb-2 mb-sm-0">
          <h1 className="text-2xl fw-bold text-gray-900 mb-1">Personel Yönetimi</h1>
          <p className="text-xs text-gray-500 mb-0">
            Personel ekleme, düzenleme ve silme işlemleri
          </p>
        </div>
        <button 
          className="btn-primary d-flex align-items-center gap-2"
          onClick={() => {
            setEditingPersonnel(null)
            setNewPersonnel({ name: '', role: '', email: '', phone: '' })
            setShowAddPersonnelModal(true)
          }}
          style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          <UserPlus style={{ width: '16px', height: '16px' }} />
          Yeni Personel Ekle
        </button>
      </div>

      {isLoading ? (
        <div className="card text-center py-5" style={{ borderRadius: '12px' }}>
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
          <p className="text-sm text-gray-500 mb-0">Personel listesi yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-5" style={{ borderRadius: '12px', border: '1px solid #fee2e2', backgroundColor: '#fef2f2' }}>
          <AlertCircle className="h-12 w-12 text-red-500 mb-3 mx-auto" />
          <p className="text-sm fw-medium text-red-700 mb-2">{error}</p>
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={() => {
              const loadPersonnel = async () => {
                try {
                  setIsLoading(true)
                  setError(null)
                  const data = await fetchPersonnel()
                  setPersonnel(data)
                } catch (error) {
                  logger.error('Error loading personnel:', error)
                  const errorMessage = 'Personel listesi yüklenirken bir hata oluştu'
                  setError(errorMessage)
                  showError(errorMessage)
                } finally {
                  setIsLoading(false)
                }
              }
              loadPersonnel()
            }}
            style={{ borderRadius: '8px' }}
          >
            Tekrar Dene
          </button>
        </div>
      ) : personnel.length === 0 ? (
        <div className="card text-center" style={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div className="p-4">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px', backgroundColor: '#f3f4f6' }}>
              <Users style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
            </div>
            <p className="text-sm fw-medium text-gray-700 mb-2">Henüz personel eklenmemiş</p>
            <p className="text-xs text-gray-500 mb-3">İlk personeli eklemek için butona tıklayın</p>
            <button 
              className="btn-primary d-inline-flex align-items-center gap-2"
              onClick={() => {
                setEditingPersonnel(null)
                setNewPersonnel({ name: '', role: '', email: '', phone: '' })
                setShowAddPersonnelModal(true)
              }}
              style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              <UserPlus style={{ width: '16px', height: '16px' }} />
              İlk Personeli Ekle
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div className="p-3">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th className="text-xs fw-semibold text-gray-700 py-2" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Ad Soyad</th>
                    <th className="text-xs fw-semibold text-gray-700 py-2" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Rol</th>
                    <th className="text-xs fw-semibold text-gray-700 py-2" style={{ fontSize: '0.75rem', fontWeight: '600' }}>E-posta</th>
                    <th className="text-xs fw-semibold text-gray-700 py-2" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Telefon</th>
                    <th className="text-xs fw-semibold text-gray-700 text-end py-2" style={{ fontSize: '0.75rem', fontWeight: '600' }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {personnel.map((person) => (
                    <tr key={person.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td className="text-sm text-gray-900 py-2.5" style={{ fontSize: '0.875rem' }}>{person.name}</td>
                      <td className="py-2.5">
                        <span className="badge" style={{ 
                          borderRadius: '6px', 
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontWeight: '500'
                        }}>
                          {person.role}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600 py-2.5" style={{ fontSize: '0.875rem' }}>{person.email}</td>
                      <td className="text-sm text-gray-600 py-2.5" style={{ fontSize: '0.875rem' }}>{person.phone || '-'}</td>
                      <td className="py-2.5">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            onClick={() => {
                              setEditingPersonnel(person)
                              setNewPersonnel({
                                name: person.name,
                                role: person.role,
                                email: person.email,
                                phone: person.phone
                              })
                              setShowAddPersonnelModal(true)
                            }}
                            className="btn btn-link p-1 text-primary border-0"
                            style={{ 
                              minWidth: '28px', 
                              minHeight: '28px',
                              padding: '0.25rem'
                            }}
                            title="Düzenle"
                          >
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`${person.name} adlı personeli silmek istediğinizden emin misiniz?`)) {
                                try {
                                  await deletePersonnel(person.id.toString())
                                  setPersonnel(personnel.filter(p => p.id !== person.id))
                                  showSuccess('Personel başarıyla silindi')
                                } catch (error) {
                                  logger.error('Error deleting personnel:', error)
                                  showError('Personel silinirken bir hata oluştu')
                                }
                              }
                            }}
                            className="btn btn-link p-1 text-danger border-0"
                            style={{ 
                              minWidth: '28px', 
                              minHeight: '28px',
                              padding: '0.25rem'
                            }}
                            title="Sil"
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddPersonnelModal && (
        <div 
          className="modal-backdrop d-flex align-items-center justify-content-center"
          style={{ zIndex: 1060, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => {
            setShowAddPersonnelModal(false)
            setNewPersonnel({ name: '', role: '', email: '', phone: '' })
            setEditingPersonnel(null)
          }}
        >
          <div 
            className="modal-content"
            style={{ 
              width: '90%',
              maxWidth: '500px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              position: 'relative',
              zIndex: 1061
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-gray-100">
              <h3 className="text-base fw-semibold text-gray-900 mb-0" style={{ fontSize: '1rem' }}>
                {editingPersonnel ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowAddPersonnelModal(false)
                  setNewPersonnel({ name: '', role: '', email: '', phone: '' })
                  setEditingPersonnel(null)
                }}
                className="btn btn-link p-1 text-gray-400 border-0"
                style={{ minWidth: '32px', minHeight: '32px' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div className="p-4">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-medium text-gray-700 mb-1.5" style={{ fontSize: '0.75rem' }}>
                    Ad Soyad <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Ad Soyad"
                    value={newPersonnel.name}
                    onChange={(e) => setNewPersonnel({ ...newPersonnel, name: e.target.value })}
                    style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                  />
                  {formErrors.name && (
                    <div className="text-danger text-xs mt-1" style={{ fontSize: '0.75rem' }}>{formErrors.name}</div>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-medium text-gray-700 mb-1.5" style={{ fontSize: '0.75rem' }}>
                    Rol <span className="text-danger">*</span>
                  </label>
                  <select
                    name="role"
                    className="form-control"
                    value={newPersonnel.role}
                    onChange={(e) => setNewPersonnel({ ...newPersonnel, role: e.target.value })}
                    style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                  >
                    <option value="">Rol seçin</option>
                    <option value="Teknisyen">Teknisyen</option>
                    <option value="Müdür">Müdür</option>
                    <option value="Operatör">Operatör</option>
                    <option value="Yönetici">Yönetici</option>
                    <option value="Uzman">Uzman</option>
                    <option value="Asistan">Asistan</option>
                  </select>
                  {formErrors.role && (
                    <div className="text-danger text-xs mt-1" style={{ fontSize: '0.75rem' }}>{formErrors.role}</div>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-medium text-gray-700 mb-1.5" style={{ fontSize: '0.75rem' }}>
                    E-posta
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="E-posta adresi"
                    value={newPersonnel.email}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || !value.includes(' ')) {
                        setNewPersonnel({ ...newPersonnel, email: value })
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim()
                      if (value && value.length > 0) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                        if (!emailRegex.test(value)) {
                          setFormErrors({ ...formErrors, email: 'Geçerli bir e-posta adresi giriniz' })
                        } else {
                          const newErrors = { ...formErrors }
                          delete newErrors.email
                          setFormErrors(newErrors)
                        }
                      }
                    }}
                    style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                  />
                  {formErrors.email && (
                    <div className="text-danger text-xs mt-1" style={{ fontSize: '0.75rem' }}>{formErrors.email}</div>
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-xs fw-medium text-gray-700 mb-1.5" style={{ fontSize: '0.75rem' }}>
                    Telefon <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    placeholder="Telefon numarası"
                    value={newPersonnel.phone}
                    maxLength={11}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                      setNewPersonnel({ ...newPersonnel, phone: value })
                    }}
                    style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                  />
                  {formErrors.phone && (
                    <div className="text-danger text-xs mt-1" style={{ fontSize: '0.75rem' }}>{formErrors.phone}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 px-4 py-3 border-top border-gray-100">
              <button
                onClick={() => {
                  setShowAddPersonnelModal(false)
                  setNewPersonnel({ name: '', role: '', email: '', phone: '' })
                  setEditingPersonnel(null)
                }}
                className="btn btn-outline-secondary"
                style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 1rem', minWidth: '100px' }}
              >
                İptal
              </button>
              <Button
                onClick={handleSavePersonnel}
                variant="primary"
                loading={isSaving}
                style={{ borderRadius: '8px', fontSize: '0.875rem', padding: '0.5rem 1rem', minWidth: '100px' }}
              >
                {editingPersonnel ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
