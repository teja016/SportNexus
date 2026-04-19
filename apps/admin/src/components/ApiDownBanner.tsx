import { WifiOff } from 'lucide-react'

export default function ApiDownBanner() {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
      <WifiOff size={16} className="flex-shrink-0" />
      <span>
        <strong>API server is not reachable</strong> — make sure it's running with{' '}
        <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">npm run dev:api</code> in a separate terminal.
      </span>
    </div>
  )
}
