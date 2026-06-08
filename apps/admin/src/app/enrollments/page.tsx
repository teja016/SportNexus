'use client'
import { useEffect, useState, useCallback } from 'react'
import { Users, Clock, Truck, XCircle } from 'lucide-react'
import apiClient from '../../services/apiClient'
import StatusBadge from '../../components/StatusBadge'
import StatCard from '../../components/StatCard'
import GradientHeader from '../../components/GradientHeader'
import ApiDownBanner from '../../components/ApiDownBanner'

const STATUS_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'CANCELLED', 'EXPIRED']
const POLL_INTERVAL = 10_000

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function EnrollmentDetailPanel({ enrollment, onClose }: { enrollment: any; onClose: () => void }) {
  const academy = enrollment.slot?.program?.academy
  const program = enrollment.slot?.program
  const slot    = enrollment.slot
  const payment = enrollment.payment
  const user    = enrollment.user

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Booking Ref</p>
            <p className="font-mono font-bold text-lg">#{enrollment.id?.slice(-8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={enrollment.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <Section title="Student">
            <Row label="Name"   value={user?.name  ?? '—'} />
            <Row label="Phone"  value={user?.phone ?? '—'} />
            <Row label="Email"  value={user?.email ?? '—'} />
          </Section>

          <Section title="Academy & Program">
            <Row label="Academy"   value={academy?.name       ?? '—'} />
            <Row label="Program"   value={program?.name       ?? '—'} />
            <Row label="Sport"     value={program?.sportType  ?? '—'} />
            <Row label="Age Group" value={program ? `${program.ageGroupMin}–${program.ageGroupMax} yrs` : '—'} />
          </Section>

          <Section title="Schedule">
            <Row label="Slot Time" value={slot ? `${slot.timeStart} – ${slot.timeEnd}` : '—'} />
            <Row label="Days"      value={(slot?.daysOfWeek ?? []).map((d: string) => d.slice(0, 3)).join(', ') || '—'} />
            <Row label="Duration"  value={`${enrollment.durationMonths} month${enrollment.durationMonths > 1 ? 's' : ''}`} />
            <Row label="Enrolled"  value={enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
          </Section>

          <Section title="Transport">
            <Row label="Opted"    value={enrollment.transportOpted ? 'Yes — Pickup & Drop' : 'No'} />
            {enrollment.transportOpted && <>
              <Row label="Address"  value={enrollment.pickupAddress  ?? '—'} />
              <Row label="Distance" value={enrollment.pickupDistance ? `${enrollment.pickupDistance} km` : '—'} />
            </>}
          </Section>

          {payment && (
            <Section title="Payment">
              <Row label="Training Fee"  value={formatINR(payment.amount)} />
              {payment.transportFee > 0 && <Row label="Transport Fee" value={formatINR(payment.transportFee)} />}
              <Row label="Total"         value={formatINR(payment.totalAmount)} highlight />
              <Row label="Gateway"       value={payment.gateway ?? '—'} />
              <Row label="Status"        value={payment.status} />
              <Row label="Webhook"       value={payment.webhookVerified ? 'Verified' : 'Unverified'} />
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold text-right ${highlight ? 'text-teal-600 text-base' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments]   = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [search, setSearch]             = useState('')
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null)
  const [selected, setSelected]         = useState<any | null>(null)
  const [apiDown, setApiDown]           = useState(false)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    apiClient.get('/admin/enrollments')
      .then((res) => {
        setEnrollments(res.data?.data ?? [])
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

  const searched = search
    ? enrollments.filter((e) =>
        e.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.slot?.program?.academy?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : enrollments

  const filtered = activeStatus === 'ALL' ? searched : searched.filter((e) => e.status === activeStatus)

  const counts: Record<string, number> = {}
  STATUS_TABS.forEach((s) => {
    counts[s] = s === 'ALL' ? searched.length : searched.filter((e) => e.status === s).length
  })

  const pendingCount    = enrollments.filter((e) => e.status === 'PENDING').length
  const transportCount  = enrollments.filter((e) => e.transportOpted).length
  const cancelledCount  = enrollments.filter((e) => e.status === 'CANCELLED').length

  return (
    <div>
      {apiDown && <ApiDownBanner />}

      <GradientHeader
        title="Enrollments"
        subtitle={lastUpdated ? `Live · updated ${lastUpdated.toLocaleTimeString('en-IN')}` : 'Loading...'}
        pills={[
          { label: 'Total', value: enrollments.length },
          { label: 'Pending', value: pendingCount },
          { label: 'Transport', value: transportCount },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}   label="Total Enrollments" value={enrollments.length} color="teal"   />
        <StatCard icon={Clock}   label="Pending Action"    value={pendingCount}       color="amber"  />
        <StatCard icon={Truck}   label="Transport Opted"   value={transportCount}     color="navy"   />
        <StatCard icon={XCircle} label="Cancelled"         value={cancelledCount}     color="purple" />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by student name or academy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 bg-white transition-colors"
        />
        <button onClick={() => load()} className="px-4 py-2.5 text-sm font-semibold text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors">
          ↻ Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors ${
              activeStatus === s
                ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-gray-800'
            }`}
            onClick={() => setActiveStatus(s)}
          >
            {s}
            {counts[s] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeStatus === s ? 'bg-white/20' : 'bg-gray-100'}`}>
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && enrollments.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading enrollments...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <p className="font-semibold">No {activeStatus !== 'ALL' ? activeStatus.toLowerCase() : ''} enrollments</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Ref', 'Student', 'Academy', 'Program', 'Duration', 'Transport', 'Payment', 'Status', 'Enrolled', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5 bg-gray-50/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-50 hover:bg-teal-50/30 cursor-pointer transition-colors last:border-0"
                  onClick={() => setSelected(e)}
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">#{e.id?.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{e.user?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{e.slot?.program?.academy?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{e.slot?.program?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{e.durationMonths} mo</td>
                  <td className="px-5 py-3.5">
                    {e.transportOpted
                      ? <span className="text-teal-600 font-semibold text-xs">Yes</span>
                      : <span className="text-gray-400 text-xs">No</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {e.payment ? <StatusBadge status={e.payment.status} /> : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-teal-500 font-semibold text-xs">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <EnrollmentDetailPanel enrollment={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
