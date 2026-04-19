const STATUS_CONFIG: Record<string, { dot: string; badge: string; label?: string }> = {
  PENDING:         { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  CONFIRMED:       { dot: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700 ring-teal-200' },
  CANCELLED:       { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 ring-red-200' },
  COMPLETED:       { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  SUCCESS:         { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  FAILED:          { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 ring-red-200' },
  REFUNDED:        { dot: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
  SCHEDULED:       { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  EN_ROUTE_PICKUP: { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200', label: 'En Route' },
  PICKED_UP:       { dot: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700 ring-teal-200', label: 'Picked Up' },
  AT_ACADEMY:      { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'At Academy' },
  RETURNING:       { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  PARENT:          { dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-600 ring-gray-200' },
  ACADEMY_ADMIN:   { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 ring-blue-200', label: 'Academy Admin' },
  SUPER_ADMIN:     { dot: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700 ring-purple-200', label: 'Super Admin' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 ring-gray-200' }
  const label  = config.label ?? status.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${config.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {label}
    </span>
  )
}
