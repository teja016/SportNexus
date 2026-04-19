'use client'
import { useEffect, useState } from 'react'
import apiClient from '../../services/apiClient'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import ApiDownBanner from '../../components/ApiDownBanner'
import { Academy } from '@sportnexus/types'

export default function AcademiesPage() {
  const [academies, setAcademies] = useState<Academy[]>([])
  const [loading, setLoading] = useState(true)
  const [apiDown, setApiDown] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiClient.get('/academies?limit=50').then((res) => {
      setAcademies(res.data?.data?.data ?? res.data?.data ?? [])
    }).catch(() => setApiDown(true)).finally(() => setLoading(false))
  }, [])

  const filtered = academies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.address?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Academies" subtitle={`${academies.length} total academies`} />
      {apiDown && <ApiDownBanner />}

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white transition-colors"
        />
      </div>

      <DataTable
        data={filtered}
        emptyMessage="No academies found"
        columns={[
          { key: 'name', header: 'Academy Name', sortable: true },
          { key: 'address', header: 'Location', sortable: true },
          { key: 'rating', header: 'Rating', sortable: true, render: (a) => `⭐ ${a.rating}` },
          { key: 'reviewCount', header: 'Reviews', sortable: true },
          {
            key: 'transportAvailable',
            header: 'Transport',
            render: (a) => a.transportAvailable
              ? <span className="text-primary font-semibold">🚌 Yes</span>
              : <span className="text-gray-400">No</span>,
          },
          {
            key: 'isVerified',
            header: 'Verified',
            render: (a) => a.isVerified
              ? <span className="bg-teal-100 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">✓ Verified</span>
              : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">Pending</span>,
          },
        ]}
      />
    </div>
  )
}
