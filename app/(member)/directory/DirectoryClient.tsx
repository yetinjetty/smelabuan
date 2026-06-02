'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import type { Member } from '@/lib/types'

type DirectoryMember = Pick<Member, 'id' | 'member_id' | 'full_name' | 'business_name' | 'business_sector' | 'business_size' | 'membership_type' | 'status'>

type Company = {
  business_name: string
  business_sector: string | null
  business_size: string | null
  members: DirectoryMember[]
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export default function DirectoryClient({ members }: { members: DirectoryMember[] }) {
  const [search, setSearch]         = useState('')
  const [sector, setSector]         = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const headerInputRef = useRef<HTMLInputElement>(null)
  const stickyInputRef = useRef<HTMLInputElement>(null)
  const headerRef      = useRef<HTMLDivElement>(null)

  // Detect when the red header scrolls out of view
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function openSearch() {
    setSearchOpen(true)
    setTimeout(() => {
      if (isScrolled) stickyInputRef.current?.focus()
      else headerInputRef.current?.focus()
    }, 50)
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearch('')
    headerInputRef.current?.blur()
    stickyInputRef.current?.blur()
  }

  // When input blurs (e.g. tapping backdrop), delay so backdrop onClick fires first
  function onInputBlur() {
    setTimeout(() => setSearchOpen(false), 200)
  }

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

  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase()
    return companies.filter(c => {
      const ok = !q || c.business_name.toLowerCase().includes(q) || (c.business_sector ?? '').toLowerCase().includes(q)
      return ok && (!sector || c.business_sector === sector)
    })
  }, [companies, search, sector])

  const count = `${filteredCompanies.length} compan${filteredCompanies.length !== 1 ? 'ies' : 'y'}`

  const chipActive   = { backgroundColor: '#ffffff', color: '#E05A4E', borderColor: '#ffffff' }
  const chipInactive = { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.4)' }

  return (
    <div>
      {/* ── Sticky search bar — slides down when header scrolls away ── */}
      <div
        className="fixed top-0 left-0 right-0 z-[200]"
        style={{
          background: 'linear-gradient(160deg, #E05A4E 0%, #c0392b 100%)',
          transform: isScrolled ? 'translateY(0)' : 'translateY(-110%)',
          opacity:   isScrolled ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
          pointerEvents: isScrolled ? 'all' : 'none',
          boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        }}
      >
        {/* Search row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="flex-1 flex items-center gap-2 rounded-full px-4 py-2"
            style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
          >
            <span className="text-white/60 shrink-0"><SearchIcon size={15} /></span>
            <input
              ref={stickyInputRef}
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={onInputBlur}
              placeholder="Search company or sector…"
              style={{ fontSize: 16, background: 'transparent', minWidth: 0 }}
              className="flex-1 outline-none text-white placeholder-white/50"
            />
            {search && (
              <button onMouseDown={e => { e.preventDefault(); setSearch('') }} className="text-white/70 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <button
            onMouseDown={e => { e.preventDefault(); closeSearch() }}
            className="text-sm font-medium text-white shrink-0"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── Backdrop — tap to dismiss keyboard + search ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[150]"
          onClick={closeSearch}
        />
      )}

      {/* ── Red header ── */}
      <div
        ref={headerRef}
        className="px-4 pt-3 pb-4 space-y-3"
        style={{
          background: 'linear-gradient(160deg, #E05A4E 0%, #c0392b 100%)',
          position: 'relative',
          zIndex: searchOpen ? 200 : 'auto',
        }}
      >
        <h1 className="text-xl font-bold text-white">Directory</h1>

        {/* Search input (expanded) or icon button + chips */}
        {searchOpen && !isScrolled ? (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            >
              <span className="text-white/60 shrink-0"><SearchIcon size={15} /></span>
              <input
                ref={headerInputRef}
                autoFocus
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onBlur={onInputBlur}
                placeholder="Search company or sector…"
                style={{ fontSize: 16, background: 'transparent', minWidth: 0 }}
                className="flex-1 outline-none text-white placeholder-white/50"
              />
              {search && (
                <button onMouseDown={e => { e.preventDefault(); setSearch('') }} className="text-white/60 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            <button
              onMouseDown={e => { e.preventDefault(); closeSearch() }}
              className="text-white text-sm font-medium shrink-0"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-0.5">
            {/* Search icon button */}
            <button
              onClick={openSearch}
              className="flex-none w-9 h-9 rounded-full flex items-center justify-center text-white/90 transition-opacity active:opacity-70"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            >
              <SearchIcon size={16} />
            </button>

            {/* All chip */}
            <button
              onClick={() => setSector('')}
              className="flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={!sector ? chipActive : chipInactive}
            >
              All
            </button>

            {sectors.map(s => (
              <button
                key={s}
                onClick={() => setSector(s === sector ? '' : s)}
                className="flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                style={sector === s ? chipActive : chipInactive}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Count — stays on red background */}
        <p className="text-xs text-white/70">{count}</p>
      </div>

      {/* ── Content sheet ── */}
      <div className="bg-gray-50 rounded-t-3xl -mt-4 px-4 pt-5 pb-6 space-y-3 min-h-screen">

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
            </div>
          ))}
          {filteredCompanies.length === 0 && <p className="text-center text-gray-400 py-12">No companies found</p>}
        </div>
      </div>
    </div>
  )
}
