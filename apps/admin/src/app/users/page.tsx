'use client'
import { useEffect, useState } from 'react'
import apiClient from '../../services/apiClient'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import ApiDownBanner from '../../components/ApiDownBanner'

const ROLE_TABS = ['ALL', 'PARENT', 'ACADEMY_ADMIN', 'SUPER_ADMIN']

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState('ALL')
  const [search, setSearch] = useState('')

  const [apiDown, setApiDown] = useState(false)

  useEffect(() => {
    apiClient.get('/admin/users').then((res) => {
      setUsers(res.data?.data ?? [])
    }).catch(() => { setUsers([]); setApiDown(true) }).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    const matchRole = activeRole === 'ALL' || u.role === activeRole
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
    return matchRole && matchSearch
  })

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} total users`} />
      {apiDown && <ApiDownBanner />}

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white transition-colors"
        />
        <div className="flex gap-2">
          {ROLE_TABS.map((r) => (
            <button
              key={r}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeRole === r
                  ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-gray-800'
              }`}
              onClick={() => setActiveRole(r)}
            >
              {r === 'ALL' ? 'All' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={filtered}
        emptyMessage="No users found"
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'phone', header: 'Phone' },
          { key: 'email', header: 'Email', render: (u) => u.email ?? '—' },
          { key: 'role', header: 'Role', render: (u) => <StatusBadge status={u.role} />, sortable: true },
          {
            key: 'fcmToken',
            header: 'Push Enabled',
            render: (u) => u.fcmToken
              ? <span className="text-accent font-semibold text-xs">✓ Yes</span>
              : <span className="text-gray-400 text-xs">No</span>,
          },
          {
            key: 'createdAt',
            header: 'Joined',
            render: (u) => u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—',
            sortable: true,
          },
        ]}
      />
    </div>
  )
}
