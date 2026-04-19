'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Users, TrendingUp, Clock, IndianRupee, ArrowUpRight } from 'lucide-react'
import apiClient from '../services/apiClient'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import PageHeader from '../components/PageHeader'
import { formatCurrency } from '@sportnexus/utils'

interface DashboardStats {
  totalEnrollments: number
  todayEnrollments: number
  activeSlots: number
  totalRevenue: number
  enrollmentsByStatus: Record<string, number>
  revenueByMonth: Array<{ month: string; revenue: number }>
}

const MOCK_STATS: DashboardStats = {
  totalEnrollments: 142,
  todayEnrollments: 8,
  activeSlots: 24,
  totalRevenue: 385000,
  enrollmentsByStatus: { CONFIRMED: 98, PENDING: 22, CANCELLED: 15, COMPLETED: 7 },
  revenueByMonth: [
    { month: 'Jan', revenue: 42000 },
    { month: 'Feb', revenue: 58000 },
    { month: 'Mar', revenue: 71000 },
    { month: 'Apr', revenue: 65000 },
    { month: 'May', revenue: 82000 },
    { month: 'Jun', revenue: 67000 },
  ],
}

export default function OverviewPage() {
  const [stats, setStats]         = useState<DashboardStats>(MOCK_STATS)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/dashboard').catch(() => ({ data: { data: MOCK_STATS } })),
      apiClient.get('/admin/enrollments?limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([dashRes, enrollRes]) => {
      setStats(dashRes.data?.data ?? MOCK_STATS)
      setEnrollments(enrollRes.data?.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const statusEntries = Object.entries(stats.enrollmentsByStatus)

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard icon={Users}        label="Total Enrollments"  value={stats.totalEnrollments}          color="teal"   trend={12} />
        <StatCard icon={TrendingUp}   label="Today's Enrollments" value={stats.todayEnrollments}         color="green"  trend={4} />
        <StatCard icon={Clock}        label="Active Slots"        value={stats.activeSlots}              color="navy" />
        <StatCard icon={IndianRupee}  label="Total Revenue"       value={formatCurrency(stats.totalRevenue)} color="amber" trend={8} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Revenue Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              +18% vs last period
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.revenueByMonth}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0D9488" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
              />
              <Area dataKey="revenue" stroke="#0D9488" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-5">Enrollment Status</h2>
          <div className="space-y-3">
            {statusEntries.map(([status, count]) => {
              const pct = Math.round((count / stats.totalEnrollments) * 100)
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <StatusBadge status={status} />
                    <span className="text-sm font-bold text-gray-800">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Recent Enrollments</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest 5 entries</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['ID', 'Student', 'Academy', 'Program', 'Status', 'Date'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No enrollments yet</td></tr>
            ) : (
              enrollments.map((e: any) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors last:border-0">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">#{(e.id ?? '').slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{e.user?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{e.slot?.program?.academy?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{e.slot?.program?.name ?? '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
