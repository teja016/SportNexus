'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import apiClient from '../../services/apiClient'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import PageHeader from '../../components/PageHeader'
import { formatCurrency } from '@sportnexus/utils'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/enrollments?limit=50').catch(() => ({ data: { data: [] } })),
      apiClient.get('/admin/revenue').catch(() => ({ data: { data: [] } })),
    ]).then(([enrollRes, revRes]) => {
      const enrollments: any[] = enrollRes.data?.data ?? []
      const allPayments = enrollments
        .map((e) => e.payment?.id ? { ...e.payment, studentName: e.user?.name, enrollmentId: e.id } : null)
        .filter(Boolean)
      setPayments(allPayments)
      setRevenue(revRes.data?.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const totalRevenue = payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0)
  const pendingRevenue = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <PageHeader title="Payments & Revenue" subtitle="Track all transactions" />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-500">Total Collected</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-500">Pending</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatCurrency(pendingRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-500">Transactions</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{payments.length}</p>
        </div>
      </div>

      {/* Chart */}
      {revenue.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Revenue by Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
              <Bar dataKey="revenue" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payments Table */}
      <DataTable
        data={payments}
        emptyMessage="No payment records yet"
        columns={[
          { key: 'id', header: 'Payment ID', render: (p) => <span className="font-mono text-xs text-gray-500">#{(p.id ?? '').slice(-8).toUpperCase()}</span> },
          { key: 'studentName', header: 'Student', render: (p) => p.studentName ?? '—', sortable: true },
          { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount), sortable: true },
          { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} />, sortable: true },
          { key: 'method', header: 'Method', render: (p) => p.method ?? 'Razorpay' },
          { key: 'razorpayOrderId', header: 'Order ID', render: (p) => p.razorpayOrderId ? <span className="font-mono text-xs text-gray-500">{p.razorpayOrderId.slice(-10)}</span> : '—' },
          { key: 'createdAt', header: 'Date', render: (p) => p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—', sortable: true },
        ]}
      />
    </div>
  )
}
