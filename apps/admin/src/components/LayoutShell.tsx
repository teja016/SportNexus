'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import Sidebar from './Sidebar'

const PAGE_TITLES: Record<string, string> = {
  '/':            'Overview',
  '/academies':   'Academies',
  '/enrollments': 'Enrollments',
  '/programs':    'Programs',
  '/users':       'Users',
  '/transit':     'Transit',
  '/payments':    'Payments',
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const isLogin   = pathname === '/login'
  const [ready, setReady] = useState(false)

  const pageTitle = PAGE_TITLES[pathname] ?? PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => k !== '/' && pathname.startsWith(k)) ?? ''] ?? 'Dashboard'

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token && !isLogin) {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [pathname])

  if (isLogin) return <>{children}</>
  if (!ready)  return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-10 h-14 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-800">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell size={16} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              SN
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
