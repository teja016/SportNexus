'use client'
import { useEffect, useState, useCallback } from 'react'
import { Bus, Users, CheckCircle, XCircle } from 'lucide-react'
import apiClient from '../../services/apiClient'
import StatusBadge from '../../components/StatusBadge'
import StatCard from '../../components/StatCard'
import GradientHeader from '../../components/GradientHeader'
import ApiDownBanner from '../../components/ApiDownBanner'

const TRANSIT_STATUSES = [
  'SCHEDULED',
  'DISPATCHED',
  'ARRIVING',
  'PICKED_UP',
  'AT_ACADEMY',
  'COMPLETED',
  'CANCELLED_BY_USER',
]

const POLL_INTERVAL = 10_000

export default function TransitPage() {
  const [sessions, setSessions]       = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [apiDown, setApiDown]         = useState(false)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    apiClient.get('/admin/transit/today')
      .then((res) => {
        setSessions(res.data?.data ?? [])
        setLastUpdated(new Date())
        setApiDown(false)
      })
      .catch(() => setApiDown(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [load])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  const activeCount    = sessions.filter((s) => !['COMPLETED', 'CANCELLED_BY_USER'].includes(s.status)).length
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length
  const totalPassengers = sessions.reduce((n, s) => n + (s.passengers?.length ?? 0), 0)

  return (
    <div>
      {apiDown && <ApiDownBanner />}

      <GradientHeader
        title="Transit Sessions"
        subtitle={`Today · ${today}`}
        pills={[
          { label: 'Sessions', value: sessions.length },
          { label: 'Active', value: activeCount },
          { label: 'Passengers', value: totalPassengers },
        ]}
        action={
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                Live
              </span>
            )}
            <button
              onClick={() => load()}
              className="text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        }
      />

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {TRANSIT_STATUSES.map((s) => {
          const count = sessions.filter((sess) => sess.status === s).length
          const label = s.replace(/_/g, ' ')
          const isActive = !['COMPLETED', 'CANCELLED_BY_USER'].includes(s)
          return (
            <div
              key={s}
              className={`bg-white rounded-2xl p-3.5 ring-1 shadow-sm text-center ${
                count > 0 && isActive
                  ? 'ring-teal-200 shadow-teal-100'
                  : 'ring-gray-900/5'
              }`}
            >
              <p className="text-2xl font-extrabold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium leading-tight">{label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <StatCard icon={Bus}          label="Total Sessions"  value={sessions.length}  color="teal"   />
        <StatCard icon={CheckCircle}  label="Completed"       value={completedCount}   color="green"  />
        <StatCard icon={Users}        label="Passengers Today" value={totalPassengers}  color="navy"   />
      </div>

      {loading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <p className="font-semibold">No transit sessions today</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Session ID', 'Academy', 'Slot', 'Driver', 'Vehicle', 'Passengers', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5 bg-gray-50/80">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const academy    = s.slot?.program?.academy?.name ?? '—'
                const slotTime   = s.slot ? `${s.slot.timeStart} – ${s.slot.timeEnd}` : '—'
                const passengers = s.passengers ?? []
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors last:border-0">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">#{s.id?.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{academy}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{slotTime}</td>
                    <td className="px-5 py-3.5 text-gray-600">{s.driverName ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{s.vehicleNumber ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-gray-400" />
                        <span className="font-semibold text-gray-800">{passengers.length}</span>
                        {passengers.length > 0 && (
                          <span className="text-xs text-gray-400 truncate max-w-[120px]">
                            {passengers.slice(0, 2).map((p: any) => p.enrollment?.user?.name).filter(Boolean).join(', ')}
                            {passengers.length > 2 ? ` +${passengers.length - 2}` : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
