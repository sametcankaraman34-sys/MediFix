import { Metadata } from 'next'
import Dashboard from '@/components/pages/Dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'MediFix Dashboard - Servis talepleri, randevular ve istatistikler',
}

export default function HomePage() {
  return <Dashboard />
}
