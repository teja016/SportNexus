'use client'
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  emptyMessage?: string
  emptyIcon?: string
}

export default function DataTable<T extends { id?: string }>({
  data, columns, pageSize = 15, emptyMessage = 'No data found', emptyIcon = '📭',
}: Props<T>) {
  const [page, setSortPage]   = useState(0)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  let sorted = [...data]
  if (sortKey) {
    sorted.sort((a: any, b: any) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
  }

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
    setSortPage(0)
  }

  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/80 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer select-none hover:text-gray-800' : ''
                  }`}
                  onClick={() => col.sortable && toggleSort(String(col.key))}
                >
                  <span className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      sortKey === String(col.key)
                        ? sortAsc
                          ? <ChevronUp size={13} className="text-teal-500" />
                          : <ChevronDown size={13} className="text-teal-500" />
                        : <ChevronsUpDown size={13} className="text-gray-300" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-4xl mb-3">{emptyIcon}</span>
                    <p className="text-gray-400 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={(row as any).id ?? i}
                  className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors last:border-0"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-5 py-3.5 text-gray-700">
                      {col.render ? col.render(row) : String((row as any)[String(col.key)] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)}</span> of <span className="font-semibold text-gray-700">{sorted.length}</span> results
          </p>
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white hover:text-gray-700 transition-colors"
              disabled={page === 0}
              onClick={() => setSortPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const offset = Math.max(0, Math.min(page - 2, totalPages - 5))
              const p = i + offset
              return (
                <button
                  key={p}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    p === page
                      ? 'bg-teal-500 text-white'
                      : 'border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700'
                  }`}
                  onClick={() => setSortPage(p)}
                >
                  {p + 1}
                </button>
              )
            })}
            <button
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white hover:text-gray-700 transition-colors"
              disabled={page >= totalPages - 1}
              onClick={() => setSortPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
