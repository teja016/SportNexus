'use client'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { IndianRupee, ShieldCheck, Truck, Clock } from 'lucide-react'
import apiClient from '../../services/apiClient'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import StatCard from '../../components/StatCard'
import GradientHeader from '../../components/GradientHeader'
import { formatCurrency } from '@sportnexus/utils'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [revenue, setRevenue]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/enrollments'),
      apiClient.get('/admin/revenue'),
    ]).then(([enrollRes, revRes]) => {
      const enrollments: any[] = enrollRes.data?.data ?? []
      const allPayments = enrollments
        .map((e) => e.payment?.id ? { ...e.payment, studentName: e.user?.name, enrollmentId: e.id } : null)
        .filter(Boolean)
      setPayments(allPayments)
      setRevenue(revRes.data?.data ?? [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const successPayments = payments.filter((p) => p.status === 'SUCCESS')
  const pendingPayments = payments.filter((p) => p.status === 'PENDING')
  const totalCollected  = successPayments.reduce((s, p) => s + (p.totalAmount ?? 0), 0)
  const totalTraining   = successPayments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalTransport  = successPayments.reduce((s, p) => s + (p.transportFee ?? 0), 0)
  const totalPending    = pendingPayments.reduce((s, p) => s + (p.totalAmount ?? 0), 0)

  const chartData = revenue.map((r) => {
    const [year, month] = r.month.split('-')
    const label = new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString('en-US', { month: 'short' }) + " '" + year.slice(2)
    return { ...r, label }
  })

  return (
    <div>
      <GradientHeader
        title="Payments & Revenue"
        subtitle="Track all transactions and collected revenue"
        pills={[
          { label: 'Collected', value: formatCurrency(totalCollected) },
          { label: 'Transactions', value: successPayments.length },
          { label: 'Pending', value: formatCurrency(totalPending) },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={IndianRupee} label="Total Collected"   value={formatCurrency(totalCollected)}  color="teal"   />
        <StatCard icon={IndianRupee} label="Training Revenue"  value={formatCurrency(totalTraining)}   color="navy"   />
        <StatCard icon={Truck}       label="Transport Revenue" value={formatCurrency(totalTransport)}  color="green"  />
        <StatCard icon={Clock}       label="Pending Amount"    value={formatCurrency(totalPending)}    color="amber"  />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Monthly Revenue Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name === 'training' ? 'Training' : name === 'transport' ? 'Transport' : 'Total']} />
              <Legend formatter={(v) => v === 'training' ? 'Training' : v === 'transport' ? 'Transport' : v} />
              <Bar dataKey="training"  fill="#0D9488" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="transport" fill="#1E3A5F" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
        <DataTable
          data={payments}
          emptyMessage="No payment records yet"
          columns={[
            { key: 'id', header: 'Payment ID', render: (p) => <span className="font-mono text-xs text-gray-500">#{(p.id ?? '').slice(-8).toUpperCase()}</span> },
            { key: 'studentName', header: 'Student', render: (p) => p.studentName ?? '—', sortable: true },
            { key: 'totalAmount', header: 'Total', render: (p) => formatCurrency(p.totalAmount ?? 0), sortable: true },
            { key: 'amount', header: 'Training', render: (p) => formatCurrency(p.amount ?? 0) },
            { key: 'transportFee', header: 'Transport', render: (p) => formatCurrency(p.transportFee ?? 0) },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} />, sortable: true },
            {
              key: 'webhookVerified',
              header: 'Verified',
              render: (p) => p.webhookVerified
                ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600"><ShieldCheck size={12} />Yes</span>
                : <span className="text-xs text-gray-400">No</span>,
            },
            { key: 'gatewayOrderId', header: 'Order ID', render: (p) => p.gatewayOrderId ? <span className="font-mono text-xs text-gray-500">{p.gatewayOrderId.slice(-12)}</span> : '—' },
            { key: 'createdAt', header: 'Date', render: (p) => p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—', sortable: true },
          ]}
        />
      </div>
    </div>
  )
}
