'use client'
import { useEffect, useState } from 'react'
import { Users, ShieldCheck, Bell, UserCog } from 'lucide-react'
import apiClient from '../../services/apiClient'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import StatCard from '../../components/StatCard'
import GradientHeader from '../../components/GradientHeader'
import ApiDownBanner from '../../components/ApiDownBanner'

const ROLE_TABS = ['ALL', 'USER', 'ACADEMY_ADMIN', 'SUPER_ADMIN']

export default function UsersPage() {
  const [users, setUsers]         = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeRole, setActiveRole] = useState('ALL')
  const [search, setSearch]       = useState('')
  const [apiDown, setApiDown]     = useState(false)

  useEffect(() => {
    apiClient.get('/admin/users')
      .then((res) => setUsers(res.data?.data ?? []))
      .catch(() => setApiDown(true))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    const matchRole   = activeRole === 'ALL' || u.role === activeRole
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
    return matchRole && matchSearch
  })

  const appUsers    = users.filter((u) => u.role === 'USER').length
  const admins      = users.filter((u) => u.role === 'ACADEMY_ADMIN' || u.role === 'SUPER_ADMIN').length
  const pushEnabled = users.filter((u) => u.fcmToken).length

  return (
    <div>
      {apiDown && <ApiDownBanner />}

      <GradientHeader
        title="Users"
        subtitle="Manage all registered platform users"
        pills={[
          { label: 'Total', value: users.length },
          { label: 'App Users', value: appUsers },
          { label: 'Push Enabled', value: pushEnabled },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}      label="Total Users"     value={users.length}   color="teal"   />
        <StatCard icon={Users}      label="App Users"       value={appUsers}       color="green"  />
        <StatCard icon={UserCog}    label="Admins"          value={admins}         color="navy"   />
        <StatCard icon={Bell}       label="Push Enabled"    value={pushEnabled}    color="amber"  />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
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
              {r !== 'ALL' && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeRole === r ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {users.filter((u) => u.role === r).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
        <DataTable
          data={filtered}
          emptyMessage="No users found"
          columns={[
            { key: 'name',  header: 'Name',  sortable: true },
            { key: 'phone', header: 'Phone' },
            { key: 'email', header: 'Email', render: (u) => u.email ?? '—' },
            { key: 'role',  header: 'Role',  render: (u) => <StatusBadge status={u.role} />, sortable: true },
            {
              key: 'homeAddress',
              header: 'Address',
              render: (u) => u.homeAddress
                ? <span className="text-xs text-gray-500 truncate max-w-[160px] block">{u.homeAddress}</span>
                : <span className="text-gray-300 text-xs">—</span>,
            },
            {
              key: 'fcmToken',
              header: 'Push',
              render: (u) => u.fcmToken
                ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600"><Bell size={11} />On</span>
                : <span className="text-gray-400 text-xs">Off</span>,
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
    </div>
  )
}
