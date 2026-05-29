'use client'

export default function LogExport() {
  return (
    <div className="flex gap-2">
      <a
        href="/api/export?format=csv"
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
      >
        Export CSV
      </a>
      <a
        href="/api/export?format=excel"
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
      >
        Export Excel
      </a>
    </div>
  )
}
