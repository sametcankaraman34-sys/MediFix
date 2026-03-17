import { Metadata } from 'next'
import ServiceRequests from '@/components/pages/ServiceRequests'

export const metadata: Metadata = {
  title: 'Servis Talepleri',
  description: 'Servis talepleri yönetimi - Yeni talep oluştur, düzenle ve takip et',
}

export default function ServiceRequestsPage() {
  return <ServiceRequests />
}
