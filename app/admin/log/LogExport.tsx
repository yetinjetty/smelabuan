'use client'

export default function LogExport() {
  return (
    <div className="flex gap-2">
      <a
        href="/api/export?format=csv"
        className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-white hover:bg-gray-700 font-medium transition-colors"
      >
        Export CSV
      </a>
      <a
        href="/api/export?format=excel"
        className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-white hover:bg-gray-700 font-medium transition-colors"
      >
        Export Excel
      </a>
    </div>
  )
}
