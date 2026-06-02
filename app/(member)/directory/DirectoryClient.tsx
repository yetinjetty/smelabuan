'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import type { Member } from '@/lib/types'
import FadeCard from '@/components/FadeCard'

type DirectoryMember = Pick<Member, 'id' | 'member_id' | 'full_name' | 'business_name' | 'business_sector' | 'business_size' | 'membership_type' | 'status'>

type Company = {
  business_name: string
  business_sector: string | null
  business_size: string | null
  members: DirectoryMember[]
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const NAV_H = 64 // MemberNav height in px

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export default function DirectoryClient({ members }: { members: DirectoryMember[] }) {
  const [search, setSearch]             = useState('')
  const [sector, setSector]             = useState('')
  const [searchOpen, setSearchOpen]     = useState(false)
  const [isScrolled, setIsScrolled]     = useState(false)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [sliderActive, setSliderActive] = useState(false)
  const [sliderTop, setSliderTop]       = useState(160) // will be updated after mount

  const headerInputRef = useRef<HTMLInputElement>(null)
  const stickyInputRef = useRef<HTMLInputElement>(null)
  const headerRef      = useRef<HTMLDivElement>(null)
  const lettersRef     = useRef<HTMLDivElement>(null) // only the bounded letter area

  // Update slider top = bottom of red header (or sticky bar height when scrolled past)
  useEffect(() => {
    function update() {
      const el = headerRef.current
      if (!el) return
      const bottom = el.getBoundingClientRect().bottom
      // +6px buffer so letters clear the red header on Android
      setSliderTop(Math.max(bottom + 6, 66))
    }
    // Double rAF: lets layout settle before measuring on Android
    requestAnimationFrame(() => requestAnimationFrame(update))
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

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
    // Focus synchronously within the user-gesture call stack so iOS triggers the keyboard
    if (isScrolled) stickyInputRef.current?.focus()
    else headerInputRef.current?.focus()
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
  // letterFromY calculates based on the visible letters container, not the full fixed div
  function letterFromY(clientY: number): string | null {
    const el = lettersRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const idx = Math.floor(((clientY - rect.top) / rect.height) * ALPHABET.length)
    return ALPHABET[Math.max(0, Math.min(ALPHABET.length - 1, idx))] ?? null
  }

  function scrollToLetter(letter: string) {
    const target = Array.from(activeLetters).find(l => l >= letter) ?? Array.from(activeLetters).at(-1)
    if (!target) return
    const el = document.getElementById(`dir-${target}`)
    if (!el) return
    // window.scrollTo avoids the iOS Safari scrollIntoView bug that displaces
    // position:fixed elements. rAF forces a repaint so the nav/sticky bar
    // re-composites at the correct position after the programmatic scroll.
    const top = el.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo(0, top)
    requestAnimationFrame(() => window.scrollTo(0, top))
  }

  function onSliderTouchStart(e: React.TouchEvent) {
    e.preventDefault()
    setSliderActive(true)
    const l = letterFromY(e.touches[0].clientY)
    if (l) { setActiveLetter(l); scrollToLetter(l) }
  }

  function onSliderTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    const l = letterFromY(e.touches[0].clientY)
    if (l && l !== activeLetter) { setActiveLetter(l); scrollToLetter(l) }
  }

  function onSliderTouchEnd() {
    setSliderActive(false)
    setActiveLetter(null)
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

  const groupedCompanies = useMemo(() => {
    const groups: { letter: string; companies: Company[] }[] = []
    for (const c of filteredCompanies) {
      const letter = c.business_name[0].toUpperCase()
      const last = groups[groups.length - 1]
      if (last?.letter === letter) last.companies.push(c)
      else groups.push({ letter, companies: [c] })
    }
    return groups
  }, [filteredCompanies])

  const activeLetters = useMemo(
    () => new Set(filteredCompanies.map(c => c.business_name[0].toUpperCase())),
    [filteredCompanies]
  )

  const count = `${filteredCompanies.length} compan${filteredCompanies.length !== 1 ? 'ies' : 'y'}`
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
        <div className="flex items-center gap-3 py-3" style={{ paddingLeft: '1.5rem', paddingRight: 'calc(1.5rem + 1.75rem)' }}>
          <div className="flex-1 min-w-0 flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
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
          <button onMouseDown={e => { e.preventDefault(); closeSearch() }} className="text-sm font-medium text-white shrink-0">Cancel</button>
        </div>
      </div>

      {searchOpen && <div className="fixed inset-0 z-[150]" onClick={closeSearch} />}

      {/* ── Red header ── */}
      <div
        ref={headerRef}
        className="px-6 pt-8 pb-8 space-y-5"
        style={{
          background: 'linear-gradient(160deg, #E05A4E 0%, #c0392b 100%)',
          position: 'relative',
          zIndex: searchOpen ? 200 : 'auto',
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Directory</h1>
          <p className="text-xs text-white/70">{count}</p>
        </div>

        {/* Filter / search row — cross-fade with slide on toggle */}
        {!isScrolled && (
          <div className="relative" style={{ height: '2.5rem' }}>

            {/* Chips row — slides left + fades out when search opens */}
            <div
              className="absolute inset-x-0 top-0 flex items-center gap-2 h-10"
              style={{
                opacity: searchOpen ? 0 : 1,
                transform: searchOpen ? 'translateX(-10px)' : 'translateX(0)',
                transition: 'opacity 0.22s ease, transform 0.22s ease',
                pointerEvents: searchOpen ? 'none' : 'all',
              }}
            >
              <button onClick={openSearch} className="flex-none w-9 h-9 rounded-full flex items-center justify-center text-white/90 active:opacity-70" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
                <SearchIcon size={16} />
              </button>
              <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => { setSector(''); setActiveLetter(null); window.scrollTo(0, 0) }} className="flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors" style={!sector ? chipActive : chipInactive}>All</button>
                {sectors.map(s => (
                  <button key={s} onClick={() => { setSector(s === sector ? '' : s); setActiveLetter(null); window.scrollTo(0, 0) }} className="flex-none px-4 py-1.5 rounded-full text-sm font-medium border transition-colors" style={sector === s ? chipActive : chipInactive}>{s}</button>
                ))}
              </div>
            </div>

            {/* Search input — slides in from right + fades in when search opens */}
            <div
              className="absolute inset-x-0 top-0 flex items-center gap-2 h-10"
              style={{
                opacity: searchOpen ? 1 : 0,
                transform: searchOpen ? 'translateX(0)' : 'translateX(10px)',
                transition: 'opacity 0.22s ease, transform 0.22s ease',
                pointerEvents: searchOpen ? 'all' : 'none',
              }}
            >
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
                <span className="text-white/60 shrink-0"><SearchIcon size={15} /></span>
                <input
                  ref={headerInputRef}
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
              <button onMouseDown={e => { e.preventDefault(); closeSearch() }} className="text-white text-sm font-medium shrink-0">Cancel</button>
            </div>

          </div>
        )}
      </div>

      {/* ── Content sheet — right padding leaves room for the slider ── */}
      <div className="bg-gray-50 rounded-t-3xl -mt-4 pt-8 pb-28" style={{ paddingLeft: '1.5rem', paddingRight: '2.25rem' }}>
        {groupedCompanies.length === 0 && (
          <p className="text-center text-gray-400 py-12">No companies found</p>
        )}
        {groupedCompanies.map(group => (
          <div key={group.letter} className="mb-4">
            <div id={`dir-${group.letter}`} />
            <div className="space-y-3">
              {group.companies.map(c => (
                <FadeCard key={c.business_name}>
                  <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <p className="font-semibold text-gray-900">{c.business_name}</p>
                    {c.business_sector && <p className="text-sm text-gray-500 mt-0.5">{c.business_sector}</p>}
                    {c.business_size && (
                      <div className="mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.business_size}</span>
                      </div>
                    )}
                  </div>
                </FadeCard>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Alphabet slider ──────────────────────────────────────
           Outer div: full-height fixed, catches all touch events.
           Inner div (lettersRef): sits only in the white content zone
           between the header bottom and the nav bar top.
      ─────────────────────────────────────────────────────────── */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[100]"
        style={{ width: '1.75rem', touchAction: 'none' }}
        onTouchStart={onSliderTouchStart}
        onTouchMove={onSliderTouchMove}
        onTouchEnd={onSliderTouchEnd}
      >
        <div
          ref={lettersRef}
          className="absolute left-0 right-0 flex flex-col justify-between"
          style={{ top: sliderTop, bottom: NAV_H }}
        >
          {ALPHABET.map(l => (
            <button
              key={l}
              onMouseDown={() => { setSliderActive(true); setActiveLetter(l); scrollToLetter(l) }}
              onMouseUp={() => { setSliderActive(false); setActiveLetter(null) }}
              className="flex items-center justify-center transition-transform"
              style={{
                fontSize: 10,
                fontWeight: activeLetter === l ? 700 : 500,
                color: activeLetter === l
                  ? '#E05A4E'
                  : activeLetters.has(l) ? '#9ca3af' : '#d1d5db',
                transform: activeLetter === l ? 'scale(1.5)' : 'scale(1)',
                flex: 1,
                lineHeight: 1,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Big letter bubble while sliding ── */}
      {sliderActive && activeLetter && (
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] w-20 h-20 rounded-3xl flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
        >
          <span className="text-white text-4xl font-bold">{activeLetter}</span>
        </div>
      )}
    </div>
  )
}
