import type { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ToastContext'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'MediFix | Medical Service Tracker',
    template: '%s | MediFix'
  },
  description: 'Tıbbi cihaz servis takip web uygulaması. Servis talepleri, randevular, raporlar ve personel yönetimi için kapsamlı çözüm.',
  keywords: ['medifix', 'tıbbi cihaz', 'servis takip', 'medikal', 'cihaz yönetimi', 'servis yönetimi'],
  authors: [{ name: 'MediFix Software Solutions' }],
  creator: 'MediFix Software Solutions',
  publisher: 'MediFix Software Solutions',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://medifix.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: '/',
    siteName: 'MediFix',
    title: 'MediFix | Medical Service Tracker',
    description: 'Tıbbi cihaz servis takip web uygulaması. Servis talepleri, randevular, raporlar ve personel yönetimi için kapsamlı çözüm.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MediFix Medical Service Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MediFix | Medical Service Tracker',
    description: 'Tıbbi cihaz servis takip web uygulaması',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <MainLayout>{children}</MainLayout>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
