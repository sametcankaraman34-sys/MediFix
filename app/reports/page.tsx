import { Metadata } from 'next'
import Reports from '@/components/pages/Reports'

export const metadata: Metadata = {
  title: 'Raporlar & Analitik',
  description: 'Servis raporları oluştur ve analiz et',
}

export default function ReportsPage() {
  return <Reports />
}
