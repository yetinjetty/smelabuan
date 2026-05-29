'use client'

import { useState } from 'react'
import type { Member } from '@/lib/types'

type DirectoryMember = Pick<Member, 'id' | 'member_id' | 'full_name' | 'business_name' | 'business_sector' | 'business_size' | 'membership_type' | 'status'>

export default function DirectoryClient({ members }: { members: DirectoryMember[] }) {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')

  const sectors = Array.from(new Set(members.map(m => m.business_sector).filter(Boolean)))

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      m.full_name.toLowerCase().includes(q) ||
      (m.business_name ?? '').toLowerCase().includes(q)
    const matchSector = !sector || m.business_sector === sector
    return matchSearch && matchSector
  })

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search name or business…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A4E] focus:border-transparent"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          onClick={() => setSector('')}
          className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !sector ? 'text-white border-[#E05A4E] bg-[#E05A4E]' : 'border-gray-300 text-gray-600'
          }`}
        >
          All
        </button>
        {sectors.map(s => (
          <button
            key={s}
            onClick={() => setSector(s === sector ? '' : s!)}
            className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              sector === s ? 'text-white border-[#E05A4E] bg-[#E05A4E]' : 'border-gray-300 text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-3">
        {filtered.map(m => (
          <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{m.full_name}</p>
                {m.business_name && (
                  <p className="text-sm text-gray-500 truncate">{m.business_name}</p>
                )}
              </div>
              <span className={`flex-none text-xs px-2 py-1 rounded-full font-medium ${
                m.membership_type === 'Life' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {m.membership_type}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {m.business_sector && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {m.business_sector}
                </span>
              )}
              {m.business_size && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {m.business_size}
                </span>
              )}
              <span className="text-xs text-gray-400">{m.member_id}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">No members found</p>
        )}
      </div>
    </div>
  )
}
