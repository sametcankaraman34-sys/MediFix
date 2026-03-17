import { Metadata } from 'next'
import Appointments from '@/components/pages/Appointments'

export const metadata: Metadata = {
  title: 'Servis Takvimi',
  description: 'Randevu yönetimi - Yeni randevu oluştur ve takvim görünümü',
}

export default function AppointmentsPage() {
  return <Appointments />
}
