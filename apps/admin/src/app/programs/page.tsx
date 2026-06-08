'use client'
import { useEffect, useState } from 'react'
import { BookOpen, Layers, BarChart2 } from 'lucide-react'
import apiClient from '../../services/apiClient'
import StatCard from '../../components/StatCard'
import GradientHeader from '../../components/GradientHeader'
import { formatCurrency } from '@sportnexus/utils'

function CapacityBar({ enrolled, total }: { enrolled: number; total: number }) {
  const pct = total > 0 ? Math.min(Math.round((enrolled / total) * 100), 100) : 0
  const color = pct >= 90 ? 'from-red-400 to-red-500' : pct >= 70 ? 'from-amber-400 to-amber-500' : 'from-teal-400 to-teal-500'
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{enrolled}/{total}</span>
    </div>
  )
}

export default function ProgramsPage() {
  const [academies, setAcademies]         = useState<any[]>([])
  const [selectedAcademy, setSelectedAcademy] = useState('')
  const [programs, setPrograms]           = useState<any[]>([])
  const [loadingAcademies, setLoadingAcademies] = useState(true)
  const [loadingPrograms, setLoadingPrograms]   = useState(false)

  useEffect(() => {
    apiClient.get('/academies?limit=50').then((res) => {
      const data = res.data?.data?.data ?? res.data?.data ?? []
      setAcademies(data)
      if (data.length > 0) setSelectedAcademy(data[0].id)
    }).catch(() => {}).finally(() => setLoadingAcademies(false))
  }, [])

  useEffect(() => {
    if (!selectedAcademy) return
    setLoadingPrograms(true)
    apiClient.get(`/academies/${selectedAcademy}/programs`).then((res) => {
      setPrograms(res.data?.data ?? [])
    }).catch(() => {}).finally(() => setLoadingPrograms(false))
  }, [selectedAcademy])

  const totalSlots    = programs.reduce((n, p) => n + (p.slots?.length ?? 0), 0)
  const totalCapacity = programs.reduce((n, p) => n + (p.slots?.reduce((s: number, sl: any) => s + (sl.totalCapacity ?? 0), 0) ?? 0), 0)
  const totalEnrolled = programs.reduce((n, p) => n + (p.slots?.reduce((s: number, sl: any) => s + (sl.enrolledCount ?? 0), 0) ?? 0), 0)
  const avgUtilization = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

  return (
    <div>
      <GradientHeader
        title="Programs & Slots"
        subtitle="Manage academy programs and slot capacity"
        pills={[
          { label: 'Programs', value: programs.length },
          { label: 'Slots', value: totalSlots },
          { label: 'Utilization', value: `${avgUtilization}%` },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={BookOpen}  label="Programs"         value={programs.length}    color="teal"   />
        <StatCard icon={Layers}    label="Total Slots"      value={totalSlots}         color="navy"   />
        <StatCard icon={BarChart2} label="Avg Utilization"  value={`${avgUtilization}%`} color="amber" />
      </div>

      <div className="mb-6">
        <select
          value={selectedAcademy}
          onChange={(e) => setSelectedAcademy(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white min-w-64 transition-colors"
          disabled={loadingAcademies}
        >
          {academies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {loadingPrograms ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl ring-1 ring-gray-900/5 p-5 animate-pulse">
              <div className="h-4 w-48 bg-gray-100 rounded mb-3" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <p className="font-semibold">No programs for this academy</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((p) => {
            const slots        = p.slots ?? []
            const progCapacity = slots.reduce((s: number, sl: any) => s + (sl.totalCapacity ?? 0), 0)
            const progEnrolled = slots.reduce((s: number, sl: any) => s + (sl.enrolledCount ?? 0), 0)
            return (
              <div key={p.id} className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
                <div className="flex items-start justify-between p-5 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{p.name}</h3>
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">{p.sportType}</span>
                      {p.isActive !== false
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
                        : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Inactive</span>
                      }
                    </div>
                    <p className="text-sm text-gray-500">
                      {p.ageGroupMin}–{p.ageGroupMax} yrs &nbsp;·&nbsp; {formatCurrency(p.feeMonthly)}/month
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <p className="text-xs text-gray-400">Capacity</p>
                      <CapacityBar enrolled={progEnrolled} total={progCapacity} />
                    </div>
                  </div>
                </div>

                {slots.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {slots.map((sl: any) => (
                      <div key={sl.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60 transition-colors">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">{sl.timeStart} – {sl.timeEnd}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {(sl.daysOfWeek ?? []).map((d: string) => d.slice(0, 3)).join(', ') || 'Days TBD'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <CapacityBar enrolled={sl.enrolledCount ?? 0} total={sl.totalCapacity ?? 0} />
                          {sl.isActive !== false
                            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                            : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
