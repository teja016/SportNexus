'use client'
import { useEffect, useState } from 'react'
import apiClient from '../../services/apiClient'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import { formatCurrency } from '@sportnexus/utils'

export default function ProgramsPage() {
  const [academies, setAcademies] = useState<any[]>([])
  const [selectedAcademy, setSelectedAcademy] = useState('')
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiClient.get('/academies?limit=50').then((res) => {
      const data = res.data?.data?.data ?? res.data?.data ?? []
      setAcademies(data)
      if (data.length > 0) setSelectedAcademy(data[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedAcademy) return
    setLoading(true)
    apiClient.get(`/academies/${selectedAcademy}/programs`).then((res) => {
      setPrograms(res.data?.data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [selectedAcademy])

  return (
    <div>
      <PageHeader title="Programs & Slots" subtitle="Manage academy programs and slot capacity" />

      {/* Academy Selector */}
      <div className="mb-6">
        <select
          value={selectedAcademy}
          onChange={(e) => setSelectedAcademy(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white min-w-64"
        >
          {academies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <DataTable
        data={programs}
        emptyMessage="No programs for this academy"
        columns={[
          { key: 'name', header: 'Program Name', sortable: true },
          { key: 'sportType', header: 'Sport', sortable: true },
          {
            key: 'ageGroup',
            header: 'Age Group',
            render: (p) => `${p.ageGroupMin}–${p.ageGroupMax} yrs`,
          },
          {
            key: 'feeMonthly',
            header: 'Monthly Fee',
            render: (p) => formatCurrency(p.feeMonthly),
            sortable: true,
          },
          {
            key: 'slots',
            header: 'Slots',
            render: (p) => (
              <span className="bg-teal-100 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                {p.slots?.length ?? 0} slots
              </span>
            ),
          },
          {
            key: 'capacity',
            header: 'Total Capacity',
            render: (p) => {
              const total    = p.slots?.reduce((s: number, sl: any) => s + sl.maxCapacity, 0) ?? 0
              const enrolled = p.slots?.reduce((s: number, sl: any) => s + sl.enrolledCount, 0) ?? 0
              return `${enrolled} / ${total}`
            },
          },
        ]}
      />
    </div>
  )
}
