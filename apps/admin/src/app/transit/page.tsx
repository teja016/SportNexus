'use client'
import { useEffect, useState } from 'react'
import apiClient from '../../services/apiClient'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'

export default function TransitPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    apiClient.get('/transit/today').then((res) => {
      setSessions(res.data?.data ?? [])
    }).catch(() => setSessions([])).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Transit Sessions" subtitle={`Today · ${today} · ${sessions.length} sessions`} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {['SCHEDULED', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'COMPLETED'].map((s) => {
          const count = sessions.filter((sess) => sess.status === s).length
          return (
            <div key={s} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-semibold">{s.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{count}</p>
            </div>
          )
        })}
      </div>

      <DataTable
        data={sessions}
        emptyMessage="No transit sessions today"
        columns={[
          { key: 'id', header: 'Session ID', render: (s) => <span className="font-mono text-xs text-gray-500">#{s.id.slice(-8).toUpperCase()}</span> },
          { key: 'enrollment', header: 'Student', render: (s) => s.enrollment?.user?.name ?? '—' },
          { key: 'academy', header: 'Academy', render: (s) => s.enrollment?.slot?.program?.academy?.name ?? '—' },
          { key: 'driverName', header: 'Driver', render: (s) => s.driverName ?? '—' },
          { key: 'vehicleNumber', header: 'Vehicle', render: (s) => s.vehicleNumber ?? '—' },
          { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} />, sortable: true },
          { key: 'date', header: 'Date', render: (s) => new Date(s.date).toLocaleDateString('en-IN') },
        ]}
      />
    </div>
  )
}
