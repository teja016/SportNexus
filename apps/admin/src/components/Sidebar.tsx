'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, ClipboardList, Target,
  Users, Bus, CreditCard, LogOut, Trophy,
} from 'lucide-react'

const NAV = [
  { href: '/',            icon: LayoutDashboard, label: 'Overview' },
  { href: '/academies',   icon: Building2,        label: 'Academies' },
  { href: '/enrollments', icon: ClipboardList,    label: 'Enrollments' },
  { href: '/programs',    icon: Target,           label: 'Programs' },
  { href: '/users',       icon: Users,            label: 'Users' },
  { href: '/transit',     icon: Bus,              label: 'Transit' },
  { href: '/payments',    icon: CreditCard,       label: 'Payments' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  function handleLogout() {
    localStorage.removeItem('accessToken')
    router.push('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-10 border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
            <Trophy size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">SportNexus</p>
            <p className="text-slate-400 text-xs mt-0.5">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Menu</p>
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <Icon size={16} className={active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'} />
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent"
        >
          <LogOut size={16} className="text-slate-500 group-hover:text-red-400" />
          Logout
        </button>
        <p className="text-slate-600 text-xs px-3 pt-1">v1.0.0 · SportNexus</p>
      </div>
    </aside>
  )
}
