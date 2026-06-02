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

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}

export default function DirectoryClient({ members }: { members: DirectoryMember[] }) {
  const [tab, setTab] = useState<Tab>('members')
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  function closeSearch() { setSearchOpen(false); setSearch('') }
  function switchTab(t: Tab) { setTab(t); setSearch(''); setSector(''); setSearchOpen(false) }

  const sectors = useMemo(
    () => Array.from(new Set(members.map(m => m.business_sector).filter(Boolean))) as string[],
    [members]
  )

  const companies = useMemo<Company[]>(() => {
    const map = new Map<string, Company>()
    for (const m of members) {
      if (!m.business_name) continue
      if (!map.has(m.business_name)) {
        map.set(m.business_name, { business_name: m.business_name, business_sector: m.business_sector ?? null, business_size: m.business_size ?? null, members: [] })
      }
      map.get(m.business_name)!.members.push(m)
    }
    return Array.from(map.values()).sort((a, b) => a.business_name.localeCompare(b.business_name))
  }, [members])

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase()
    return members.filter(m => {
      const matchSearch = !q || m.full_name.toLowerCase().includes(q) || (m.business_name ?? '').toLowerCase().includes(q)
      return matchSearch && (!sector || m.business_sector === sector)
    })
  }, [members, search, sector])

  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase()
    return companies.filter(c => {
      const matchSearch = !q || c.business_name.toLowerCase().includes(q) || (c.business_sector ?? '').toLowerCase().includes(q)
      return matchSearch && (!sector || c.business_sector === sector)
    })
  }, [companies, search, sector])

  const count = tab === 'members'
    ? `${filteredMembers.length} member${filteredMembers.length !== 1 ? 's' : ''}`
    : `${filteredCompanies.length} compan${filteredCompanies.length !== 1 ? 'ies' : 'y'}`

  return (
    <div>
      {/* ── Red header ── */}
      <div
        className="px-4 pt-6 pb-8 space-y-4"
        style={{ background: 'linear-gradient(160deg, #E05A4E 0%, #c0392b 100%)' }}
      >
        <h1 className="text-2xl font-bold text-white">Directory</h1>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
          {(['members', 'companies'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: tab === t ? '#ffffff' : 'transparent',
                color: tab === t ? '#E05A4E' : 'rgba(255,255,255,0.75)',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {t === 'members' ? 'Members' : 'Companies'}
            </button>
          ))}
        </div>

        {/* Search button (collapsed) or search input (expanded) + sector chips */}
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'members' ? 'Search name or business…' : 'Search company or sector…'}
              className="flex-1 rounded-full px-4 py-2 text-sm text-white placeholder-white/60 outline-none border border-white/30"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            />
            <button
              onClick={closeSearch}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5">
            {/* Search icon button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-none w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            >
              <SearchIcon />
            </button>

            {/* All chip */}
            <button
              onClick={() => setSector('')}
              className="flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={{
                backgroundColor: !sector ? '#ffffff' : 'transparent',
                color: !sector ? '#E05A4E' : 'rgba(255,255,255,0.85)',
                borderColor: !sector ? '#ffffff' : 'rgba(255,255,255,0.4)',
              }}
            >
              All
            </button>

            {/* Sector chips */}
            {sectors.map(s => (
              <button
                key={s}
                onClick={() => setSector(s === sector ? '' : s)}
                className="flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                style={{
                  backgroundColor: sector === s ? '#ffffff' : 'transparent',
                  color: sector === s ? '#E05A4E' : 'rgba(255,255,255,0.85)',
                  borderColor: sector === s ? '#ffffff' : 'rgba(255,255,255,0.4)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content sheet — slides up over red header ── */}
      <div className="bg-gray-50 rounded-t-3xl -mt-4 px-4 pt-5 pb-6 space-y-3 min-h-screen">
        <p className="text-xs text-gray-400">{count}</p>

        {/* Members list */}
        {tab === 'members' && (
          <div className="space-y-3">
            {filteredMembers.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{m.full_name}</p>
                    {m.business_name && <p className="text-sm text-gray-500 truncate">{m.business_name}</p>}
                  </div>
                  <span className={`flex-none text-xs px-2 py-1 rounded-full font-medium ${m.membership_type === 'Life' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {m.membership_type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.business_sector && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.business_sector}</span>}
                  {m.business_size && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.business_size}</span>}
                  <span className="text-xs text-gray-400">{m.member_id}</span>
                </div>
              </div>
            ))}
            {filteredMembers.length === 0 && <p className="text-center text-gray-400 py-12">No members found</p>}
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
                    {c.business_sector && <p className="text-sm text-gray-500 truncate">{c.business_sector}</p>}
                  </div>
                  <span className="flex-none text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                    {c.members.length} member{c.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {c.business_size && (
                  <div className="mt-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.business_size}</span>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                  {c.members.map(m => (
                    <span key={m.id} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {m.full_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {filteredCompanies.length === 0 && <p className="text-center text-gray-400 py-12">No companies found</p>}
          </div>
        )}
      </div>
    </div>
  )
}
