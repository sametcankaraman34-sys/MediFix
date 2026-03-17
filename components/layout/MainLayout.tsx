'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import { SidebarProvider } from './SidebarContext'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="main-content-wrapper">
          <Header />
          <main className="py-6">
            <div className="container-fluid px-3 px-md-4 px-lg-5">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
