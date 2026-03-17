import { Metadata } from 'next'
import PersonnelManagement from '@/components/pages/PersonnelManagement'

export const metadata: Metadata = {
  title: 'Personel Yönetimi',
  description: 'Personel ekle, düzenle ve yönet',
}

export default function PersonnelPage() {
  return <PersonnelManagement />
}
