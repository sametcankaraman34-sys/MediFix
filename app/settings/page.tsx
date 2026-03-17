import { Metadata } from 'next'
import Settings from '@/components/pages/Settings'

export const metadata: Metadata = {
  title: 'Ayarlar',
  description: 'Uygulama ayarlarını yönet',
}

export default function SettingsPage() {
  return <Settings />
}
