'use client'
import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Building2, Clock, IndianRupee, TrendingUp, Truck, Users } from 'lucide-react'
import apiClient from '../services/apiClient'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import GradientHeader from '../components/GradientHeader'
import { formatCurrency } from '@sportnexus/utils'

interface DashboardStats {
  totalEnrollments: number
  todayEnrollments: number
  activeSlots: number
  totalRevenue: number
  totalTraining: number
  totalTransport: number
  totalAcademies: number
  totalUsers: number
  transportEnrollments: number
  enrollmentsByStatus: Record<string, number>
  revenueByMonth: Array<{ month: string; amount: number }>
}

function formatMonth(key: string) {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short' }) + " '" + year.slice(2)
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-900/5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100" />
      </div>
      <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
      <div className="h-7 w-20 bg-gray-200 rounded" />
    </div>
  )
}

export default function OverviewPage() {
  const [stats, setStats]         = useState<DashboardStats | null>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/dashboard'),
      apiClient.get('/admin/enrollments'),
    ]).then(([dashRes, enrollRes]) => {
      setStats(dashRes.data?.data ?? null)
      setEnrollments((enrollRes.data?.data ?? []).slice(0, 5))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const statusEntries = stats ? Object.entries(stats.enrollmentsByStatus) : []

  const chartData = (stats?.revenueByMonth ?? []).map((r) => ({
    ...r,
    label: formatMonth(r.month),
  }))

  return (
    <div>
      <GradientHeader
        title="Dashboard Overview"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        pills={stats ? [
          { label: 'Revenue', value: formatCurrency(stats.totalRevenue) },
          { label: 'Enrollments', value: stats.totalEnrollments },
          { label: 'Today', value: stats.todayEnrollments },
        ] : []}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats ? (
          <>
            <StatCard icon={Users}       label="Total Enrollments"   value={stats.totalEnrollments}              color="teal"   />
            <StatCard icon={TrendingUp}  label="Today's Enrollments" value={stats.todayEnrollments}             color="green"  />
            <StatCard icon={Clock}       label="Active Slots"        value={stats.activeSlots}                  color="navy"   />
            <StatCard icon={IndianRupee} label="Total Revenue"       value={formatCurrency(stats.totalRevenue)} color="amber"  />
            <StatCard icon={Building2}   label="Academies"           value={stats.totalAcademies}               color="purple" />
            <StatCard icon={Users}       label="Registered Users"    value={stats.totalUsers}                   color="teal"   />
          </>
        ) : null}
      </div>

      {/* Transport + Revenue breakdown */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <StatCard icon={IndianRupee} label="Training Revenue"   value={formatCurrency(stats.totalTraining)}   color="teal"   />
          <StatCard icon={Truck}       label="Transport Revenue"  value={formatCurrency(stats.totalTransport)}  color="navy"   />
          <StatCard icon={Truck}       label="Transport Opted"    value={stats.transportEnrollments}            color="green"  />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Revenue Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly collected revenue</p>
            </div>
          </div>
          {loading ? (
            <div className="h-[200px] bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0D9488" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                />
                <Area dataKey="amount" stroke="#0D9488" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-5">Enrollment Status</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                  <div className="h-1.5 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const pct = stats!.totalEnrollments > 0
                  ? Math.round((count / stats!.totalEnrollments) * 100)
                  : 0
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
          )}
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Recent Enrollments</h2>
          <p className="text-xs text-gray-400 mt-0.5">Latest 5 entries</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['ID', 'Student', 'Academy', 'Program', 'Status', 'Enrolled'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : enrollments.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No enrollments yet</td></tr>
            ) : (
              enrollments.map((e: any) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors last:border-0">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">#{(e.id ?? '').slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{e.user?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{e.slot?.program?.academy?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{e.slot?.program?.name ?? '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
