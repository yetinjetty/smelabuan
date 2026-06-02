'use client'

import { useState, useMemo } from 'react'
import type { Member } from '@/lib/types'

type DirectoryMember = Pick<Member, 'id' | 'member_id' | 'full_name' | 'business_name' | 'business_sector' | 'business_size' | 'membership_type' | 'status'>

type Company = {
  business_name: string
  business_sector: string | null
  business_size: string | null
  members: DirectoryMember[]
}

type Tab = 'members' | 'companies'

export default function DirectoryClient({ members }: { members: DirectoryMember[] }) {
  const [tab, setTab] = useState<Tab>('members')
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')

  const sectors = useMemo(
    () => Array.from(new Set(members.map(m => m.business_sector).filter(Boolean))) as string[],
    [members]
  )

  // Group members into companies by business_name
  const companies = useMemo<Company[]>(() => {
    const map = new Map<string, Company>()
    for (const m of members) {
      if (!m.business_name) continue
      if (!map.has(m.business_name)) {
        map.set(m.business_name, {
          business_name: m.business_name,
          business_sector: m.business_sector ?? null,
          business_size: m.business_size ?? null,
          members: [],
        })
      }
      map.get(m.business_name)!.members.push(m)
    }
    return Array.from(map.values()).sort((a, b) => a.business_name.localeCompare(b.business_name))
  }, [members])

  // Filtered members
  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase()
    return members.filter(m => {
      const matchSearch = !q || m.full_name.toLowerCase().includes(q) || (m.business_name ?? '').toLowerCase().includes(q)
      const matchSector = !sector || m.business_sector === sector
      return matchSearch && matchSector
    })
  }, [members, search, sector])

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase()
    return companies.filter(c => {
      const matchSearch = !q || c.business_name.toLowerCase().includes(q) || (c.business_sector ?? '').toLowerCase().includes(q)
      const matchSector = !sector || c.business_sector === sector
      return matchSearch && matchSector
    })
  }, [companies, search, sector])

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {(['members', 'companies'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(''); setSector('') }}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: tab === t ? '#ffffff' : 'transparent',
              color: tab === t ? '#E05A4E' : '#6B7280',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t === 'members' ? 'Members' : 'Companies'}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder={tab === 'members' ? 'Search name or business…' : 'Search company or sector…'}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A4E] focus:border-transparent bg-white"
      />

      {/* Sector filter chips */}
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
            onClick={() => setSector(s === sector ? '' : s)}
            className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              sector === s ? 'text-white border-[#E05A4E] bg-[#E05A4E]' : 'border-gray-300 text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400">
        {tab === 'members'
          ? `${filteredMembers.length} member${filteredMembers.length !== 1 ? 's' : ''}`
          : `${filteredCompanies.length} compan${filteredCompanies.length !== 1 ? 'ies' : 'y'}`}
      </p>

      {/* Members list */}
      {tab === 'members' && (
        <div className="space-y-3">
          {filteredMembers.map(m => (
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
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.business_sector}</span>
                )}
                {m.business_size && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.business_size}</span>
                )}
                <span className="text-xs text-gray-400">{m.member_id}</span>
              </div>
            </div>
          ))}
          {filteredMembers.length === 0 && (
            <p className="text-center text-gray-400 py-12">No members found</p>
          )}
        </div>
      )}

      {/* Companies list */}
      {tab === 'companies' && (
        <div className="space-y-3">
          {filteredCompanies.map(c => (
            <div key={c.business_name} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.business_name}</p>
                  {c.business_sector && (
                    <p className="text-sm text-gray-500 truncate">{c.business_sector}</p>
                  )}
                </div>
                <span className="flex-none text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                  {c.members.length} member{c.members.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {c.business_size && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.business_size}</span>
                )}
              </div>
              {/* Member names under the company */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                {c.members.map(m => (
                  <span key={m.id} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {m.full_name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {filteredCompanies.length === 0 && (
            <p className="text-center text-gray-400 py-12">No companies found</p>
          )}
        </div>
      )}
    </div>
  )
}
