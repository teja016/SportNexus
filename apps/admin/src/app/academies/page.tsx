'use client'
import { useEffect, useState } from 'react'
import { Building2, ShieldCheck, Truck, Star } from 'lucide-react'
import apiClient from '../../services/apiClient'
import StatCard from '../../components/StatCard'
import GradientHeader from '../../components/GradientHeader'
import ApiDownBanner from '../../components/ApiDownBanner'

export default function AcademiesPage() {
  const [academies, setAcademies] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [apiDown, setApiDown]     = useState(false)
  const [search, setSearch]       = useState('')
  const [cityFilter, setCityFilter] = useState('ALL')
  const [toggling, setToggling]   = useState<string | null>(null)

  useEffect(() => {
    apiClient.get('/academies?limit=50')
      .then((res) => setAcademies(res.data?.data?.data ?? res.data?.data ?? []))
      .catch(() => setApiDown(true))
      .finally(() => setLoading(false))
  }, [])

  async function toggleVerified(academy: any) {
    setToggling(academy.id)
    try {
      const res = await apiClient.patch(`/admin/academies/${academy.id}`, { isVerified: !academy.isVerified })
      const updated = res.data?.data
      setAcademies((prev) => prev.map((a) => a.id === academy.id ? { ...a, isVerified: updated?.isVerified ?? !academy.isVerified } : a))
    } catch {
    } finally {
      setToggling(null)
    }
  }

  const cities = ['ALL', ...Array.from(new Set(academies.map((a) => a.city).filter(Boolean))).sort()]

  const filtered = academies.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.address?.toLowerCase().includes(search.toLowerCase())
    const matchCity   = cityFilter === 'ALL' || a.city === cityFilter
    return matchSearch && matchCity
  })

  const verifiedCount   = academies.filter((a) => a.isVerified).length
  const transportCount  = academies.filter((a) => a.transportAvailable).length
  const avgRating       = academies.length > 0
    ? (academies.reduce((s, a) => s + (a.rating ?? 0), 0) / academies.length).toFixed(1)
    : '0.0'

  return (
    <div>
      {apiDown && <ApiDownBanner />}

      <GradientHeader
        title="Academies"
        subtitle="Manage all sports academies on the platform"
        pills={[
          { label: 'Total', value: academies.length },
          { label: 'Verified', value: verifiedCount },
          { label: 'Avg Rating', value: avgRating },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Building2}  label="Total Academies"     value={academies.length}  color="teal"   />
        <StatCard icon={ShieldCheck} label="Verified"           value={verifiedCount}     color="green"  />
        <StatCard icon={Truck}       label="Transport Available" value={transportCount}   color="navy"   />
        <StatCard icon={Star}        label="Avg Rating"         value={avgRating}         color="amber"  />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white transition-colors"
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors min-w-36"
        >
          {cities.map((c) => (
            <option key={c} value={c}>{c === 'ALL' ? 'All Cities' : c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl ring-1 ring-gray-900/5 p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <p className="font-semibold">No academies found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Academy', 'City', 'Address', 'Rating', 'Programs', 'Transport', 'Verified', 'Action'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5 bg-gray-50/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors last:border-0">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-gray-800">{a.name}</p>
                      {a.phone && <p className="text-xs text-gray-400 mt-0.5">{a.phone}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{a.city ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[180px] truncate">{a.address ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-gray-700">{a.rating ?? '—'}</span>
                      {a.reviewCount > 0 && <span className="text-gray-400 text-xs">({a.reviewCount})</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {a.programs?.length ?? 0} programs
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {a.transportAvailable
                      ? <span className="text-teal-600 font-semibold text-xs flex items-center gap-1"><Truck size={12} />Yes</span>
                      : <span className="text-gray-400 text-xs">No</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {a.isVerified
                      ? <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-semibold"><ShieldCheck size={11} />Verified</span>
                      : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium">Pending</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleVerified(a)}
                      disabled={toggling === a.id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                        a.isVerified
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-teal-200 text-teal-600 hover:bg-teal-50'
                      }`}
                    >
                      {toggling === a.id ? '...' : a.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
