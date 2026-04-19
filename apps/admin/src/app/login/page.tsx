'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Phone, KeyRound, Loader2 } from 'lucide-react'
import apiClient from '../../services/apiClient'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone]     = useState('+918888888880')
  const [otp, setOtp]         = useState('123456')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/auth/otp/verify', { phone, otp })
      const { accessToken } = res.data?.data ?? {}
      if (!accessToken) throw new Error('No token received')
      localStorage.setItem('accessToken', accessToken)
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Login failed. Check credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-teal-500/5" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-teal-500/5" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">SportNexus</p>
            <p className="text-slate-400 text-xs mt-0.5">Admin Dashboard</p>
          </div>
        </div>

        {/* Copy */}
        <div className="relative">
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Manage your sports<br />academies at scale
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Track enrollments, monitor revenue, manage transit — all in one place built for academy administrators.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: '6+', label: 'Academies' },
              { value: '31', label: 'Active Slots' },
              { value: '₹3.8L', label: 'Revenue' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-teal-400 text-xl font-extrabold">{s.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-600 text-xs">© 2026 SportNexus · All rights reserved</p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
            <p className="text-gray-900 font-bold">SportNexus Admin</p>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors"
                  placeholder="+919999999999"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">OTP</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors"
                  placeholder="Any 6 digits"
                  maxLength={6}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Dev mode: any 6 digits accepted</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-xl border border-red-100">
                <span className="text-red-400 mt-0.5">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          {/* Test credentials */}
          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Test Credentials</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Phone</span>
                <span className="font-mono text-gray-700">+918888888880</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">OTP</span>
                <span className="font-mono text-gray-700">123456</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Role</span>
                <span className="font-semibold text-purple-600">Super Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
