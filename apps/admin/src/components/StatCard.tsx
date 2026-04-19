import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  label: string
  value: string | number
  sub?: string
  trend?: number
  color?: 'teal' | 'navy' | 'green' | 'amber' | 'purple'
}

const COLOR_MAP = {
  teal:   { bg: 'bg-teal-500/10',   icon: 'text-teal-500',   ring: 'ring-teal-500/20' },
  navy:   { bg: 'bg-blue-500/10',   icon: 'text-blue-500',   ring: 'ring-blue-500/20' },
  green:  { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', ring: 'ring-emerald-500/20' },
  amber:  { bg: 'bg-amber-500/10',  icon: 'text-amber-500',  ring: 'ring-amber-500/20' },
  purple: { bg: 'bg-purple-500/10', icon: 'text-purple-500', ring: 'ring-purple-500/20' },
}

export default function StatCard({ icon: Icon, label, value, sub, trend, color = 'teal' }: Props) {
  const c = COLOR_MAP[color]
  const isUp   = trend !== undefined && trend > 0
  const isDown = trend !== undefined && trend < 0
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-900/5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ring-1 ${c.bg} ${c.ring}`}>
          <Icon size={20} className={c.icon} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isUp   ? 'bg-emerald-50 text-emerald-600' :
            isDown ? 'bg-red-50 text-red-500' :
                     'bg-gray-100 text-gray-500'
          }`}>
            <TrendIcon size={11} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-0.5 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
