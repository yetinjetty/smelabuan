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

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export default function DirectoryClient({ members }: { members: DirectoryMember[] }) {
  const [search, setSearch]           = useState('')
  const [sector, setSector]           = useState('')
  const [searchOpen, setSearchOpen]   = useState(false)
  const [isScrolled, setIsScrolled]   = useState(false)
  const [letterFilter, setLetterFilter] = useState<string | null>(null)
  const [sliderActive, setSliderActive] = useState(false)

  const headerInputRef = useRef<HTMLInputElement>(null)
  const stickyInputRef = useRef<HTMLInputElement>(null)
  const headerRef      = useRef<HTMLDivElement>(null)
  const sliderRef      = useRef<HTMLDivElement>(null)

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

  function onInputBlur() {
    setTimeout(() => setSearchOpen(false), 200)
  }

  // ── Alphabet slider ──────────────────────────────────────────
  function letterFromY(clientY: number): string | null {
    const el = sliderRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const idx = Math.floor(((clientY - rect.top) / rect.height) * ALPHABET.length)
    return ALPHABET[Math.max(0, Math.min(ALPHABET.length - 1, idx))] ?? null
  }

  function onSliderTouchStart(e: React.TouchEvent) {
    e.preventDefault()
    setSliderActive(true)
    const l = letterFromY(e.touches[0].clientY)
    if (l) setLetterFilter(l)
  }

  function onSliderTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    const l = letterFromY(e.touches[0].clientY)
    if (l) setLetterFilter(l)
  }

  function onSliderTouchEnd() {
    setSliderActive(false)
  }

  // ── Data ────────────────────────────────────────────────────
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

  // Which letters have at least one company in the current search/sector result
  const activeLetters = useMemo(
    () => new Set(filteredCompanies.map(c => c.business_name[0].toUpperCase())),
    [filteredCompanies]
  )

  const visibleCompanies = useMemo(() => {
    if (!letterFilter) return filteredCompanies
    return filteredCompanies.filter(c => c.business_name.toUpperCase().startsWith(letterFilter))
  }, [filteredCompanies, letterFilter])

  const count = `${visibleCompanies.length} compan${visibleCompanies.length !== 1 ? 'ies' : 'y'}`

  const chipActive   = { backgroundColor: '#ffffff', color: '#E05A4E', borderColor: '#ffffff' }
  const chipInactive = { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.4)' }

  return (
    <div>
      {/* ── Sticky search bar ── */}
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
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
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
          <button onMouseDown={e => { e.preventDefault(); closeSearch() }} className="text-sm font-medium text-white shrink-0">
            Cancel
          </button>
        </div>
      </div>

      {/* ── Backdrop ── */}
      {searchOpen && <div className="fixed inset-0 z-[150]" onClick={closeSearch} />}

      {/* ── Red header ── */}
      <div
        ref={headerRef}
        className="px-6 pt-3 pb-4 space-y-3"
        style={{
          background: 'linear-gradient(160deg, #E05A4E 0%, #c0392b 100%)',
          position: 'relative',
          zIndex: searchOpen ? 200 : 'auto',
        }}
      >
        <h1 className="text-xl font-bold text-white">Directory</h1>

        {searchOpen && !isScrolled ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
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
            <button onMouseDown={e => { e.preventDefault(); closeSearch() }} className="text-white text-sm font-medium shrink-0">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-0.5">
            <button
              onClick={openSearch}
              className="flex-none w-9 h-9 rounded-full flex items-center justify-center text-white/90 transition-opacity active:opacity-70"
              style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
            >
              <SearchIcon size={16} />
            </button>
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

        <p className="text-xs text-white/70">{count}</p>
      </div>

      {/* ── Content sheet ── */}
      <div className="bg-gray-50 rounded-t-3xl -mt-4 px-6 pt-5 pb-6 min-h-screen" style={{ paddingRight: '3rem' }}>

        {/* Letter filter indicator */}
        {letterFilter && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-500">
              Showing: <span className="font-semibold text-gray-800">{letterFilter}</span>
            </span>
            <button
              onClick={() => setLetterFilter(null)}
              className="text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-500 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
        )}

        <div className="space-y-3">
          {visibleCompanies.map(c => (
            <div key={c.business_name} className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="font-semibold text-gray-900">{c.business_name}</p>
              {c.business_sector && <p className="text-sm text-gray-500 mt-0.5">{c.business_sector}</p>}
              {c.business_size && (
                <div className="mt-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.business_size}</span>
                </div>
              )}
            </div>
          ))}
          {visibleCompanies.length === 0 && (
            <p className="text-center text-gray-400 py-12">No companies found</p>
          )}
        </div>
      </div>

      {/* ── Alphabet slider ── */}
      <div
        ref={sliderRef}
        className="fixed right-0 top-0 bottom-0 z-[100] flex flex-col justify-center items-center py-8 px-1 select-none"
        style={{ touchAction: 'none', width: '2rem' }}
        onTouchStart={onSliderTouchStart}
        onTouchMove={onSliderTouchMove}
        onTouchEnd={onSliderTouchEnd}
      >
        {ALPHABET.map(l => (
          <button
            key={l}
            onMouseDown={() => { setSliderActive(true); setLetterFilter(l === letterFilter ? null : l) }}
            onMouseUp={() => setSliderActive(false)}
            className="flex items-center justify-center leading-none transition-transform"
            style={{
              fontSize: 10,
              fontWeight: letterFilter === l ? 700 : 500,
              color: letterFilter === l
                ? '#E05A4E'
                : activeLetters.has(l)
                  ? '#6b7280'
                  : '#d1d5db',
              width: '1.25rem',
              height: `${100 / ALPHABET.length}%`,
              minHeight: '1rem',
              transform: letterFilter === l ? 'scale(1.4)' : 'scale(1)',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Big letter bubble while sliding ── */}
      {sliderActive && letterFilter && (
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] w-20 h-20 rounded-3xl flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
        >
          <span className="text-white text-4xl font-bold">{letterFilter}</span>
        </div>
      )}
    </div>
  )
}
