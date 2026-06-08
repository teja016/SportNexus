import React from 'react'

interface Props {
  title: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
  pills?: Array<{ label: string; value: string | number; color?: string }>
}

export default function GradientHeader({ title, subtitle, action, pills }: Props) {
  return (
    <div className="bg-gradient-to-r from-teal-600 to-[#1E3A5F] rounded-b-3xl px-8 pt-7 pb-8 mb-8 shadow-lg -mx-6 -mt-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-teal-100/80 text-sm mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {pills && pills.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-5">
          {pills.map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5"
            >
              <span className="text-white/60 text-xs font-medium">{p.label}</span>
              <span className="text-white font-extrabold text-sm">{p.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
