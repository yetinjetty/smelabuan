'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Member } from '@/lib/types'
import FadeCard from '@/components/FadeCard'

type DirectoryMember = Pick<Member, 'id' | 'member_id' | 'full_name' | 'email' | 'phone' | 'business_name' | 'business_sector' | 'business_size' | 'membership_type' | 'status'>

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
  const [selected, setSelected]         = useState<Company | null>(null)
  const [sheetVisible, setSheetVisible] = useState(false)
  const sheetEl    = useRef<HTMLDivElement>(null)
  const backdropEl = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragOffset = useRef(0)

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

  // Non-passive touchmove so preventDefault() works — prevents the browser's
  // native scroll from swallowing the drag-to-dismiss gesture on the sheet.
  useEffect(() => {
    if (!selected) return
    const el = sheetEl.current
    if (!el) return
    function block(e: TouchEvent) {
      const dy = e.touches[0].clientY - dragStartY.current
      if (dy > 0 && e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [selected])

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

  // ── Company sheet ────────────────────────────────────────────
  function openSheet(company: Company) {
    setSelected(company)
    setTimeout(() => setSheetVisible(true), 10)
  }

  function closeSheet() {
    setSheetVisible(false)
    setTimeout(() => setSelected(null), 300)
  }

  function onSheetTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
    dragOffset.current = 0
  }

  function onSheetTouchMove(e: React.TouchEvent) {
    const delta = Math.max(0, e.touches[0].clientY - dragStartY.current)
    dragOffset.current = delta
    if (sheetEl.current) {
      sheetEl.current.style.transition = 'none'
      sheetEl.current.style.transform = `translateY(${delta}px)`
    }
    if (backdropEl.current) {
      const opacity = Math.max(0, 0.6 * (1 - delta / 350))
      backdropEl.current.style.backgroundColor = `rgba(0,0,0,${opacity.toFixed(2)})`
    }
  }

  function onSheetTouchEnd() {
    const offset = dragOffset.current
    dragOffset.current = 0
    if (offset > 80) {
      if (sheetEl.current) {
        sheetEl.current.style.transition = 'transform 0.25s ease'
        sheetEl.current.style.transform = 'translateY(110%)'
      }
      if (backdropEl.current) {
        backdropEl.current.style.transition = 'background-color 0.25s ease'
        backdropEl.current.style.backgroundColor = 'rgba(0,0,0,0)'
      }
      setTimeout(() => { setSelected(null); setSheetVisible(false) }, 250)
    } else {
      if (sheetEl.current) {
        sheetEl.current.style.transition = 'transform 0.3s ease'
        sheetEl.current.style.transform = 'translateY(0)'
      }
      if (backdropEl.current) {
        backdropEl.current.style.transition = 'background-color 0.3s ease'
        backdropEl.current.style.backgroundColor = 'rgba(0,0,0,0.6)'
      }
    }
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
    // Offset by the sticky search bar height so the target card isn't
    // hidden behind it. py-3 (24px) + input row (~40px) = ~64px + 8px buffer.
    const STICKY_OFFSET = 72
    const top = el.getBoundingClientRect().top + window.pageYOffset - STICKY_OFFSET
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

            {/* Chips row — flies left + shrinks out when search opens */}
            <div
              className="absolute inset-x-0 top-0 flex items-center gap-2 h-10"
              style={{
                opacity:   searchOpen ? 0 : 1,
                transform: searchOpen
                  ? 'translateX(-48px) scale(0.82)'
                  : 'translateX(0) scale(1)',
                transition: searchOpen
                  ? 'opacity 0.28s cubic-bezier(0.4,0,1,1), transform 0.28s cubic-bezier(0.4,0,1,1)'
                  : 'opacity 0.38s cubic-bezier(0.34,1.56,0.64,1), transform 0.38s cubic-bezier(0.34,1.56,0.64,1)',
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

            {/* Search input — flies in from the right with spring overshoot */}
            <div
              className="absolute inset-x-0 top-0 flex items-center gap-2 h-10"
              style={{
                opacity:   searchOpen ? 1 : 0,
                transform: searchOpen
                  ? 'translateX(0) scale(1)'
                  : 'translateX(56px) scale(0.82)',
                transition: searchOpen
                  ? 'opacity 0.38s cubic-bezier(0.22,1,0.36,1), transform 0.42s cubic-bezier(0.34,1.56,0.64,1)'
                  : 'opacity 0.22s cubic-bezier(0.4,0,1,1), transform 0.22s cubic-bezier(0.4,0,1,1)',
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
              {/* Cancel pops in independently with its own spring */}
              <button
                onMouseDown={e => { e.preventDefault(); closeSearch() }}
                className="text-white text-sm font-medium shrink-0"
                style={{
                  opacity:   searchOpen ? 1 : 0,
                  transform: searchOpen ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.7)',
                  transition: searchOpen
                    ? 'opacity 0.35s 0.1s cubic-bezier(0.22,1,0.36,1), transform 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1)'
                    : 'opacity 0.15s cubic-bezier(0.4,0,1,1), transform 0.15s cubic-bezier(0.4,0,1,1)',
                }}
              >
                Cancel
              </button>
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
              {group.companies.map(c => {
                const hasLife = c.members.some(m => m.membership_type === 'Life')
                return (
                  <FadeCard key={c.business_name}>
                    <button
                      onClick={() => openSheet(c)}
                      className="w-full text-left bg-white rounded-2xl border border-gray-200 p-4 active:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 min-w-0">{c.business_name}</p>
                        <span className={`flex-none text-xs px-2 py-0.5 rounded-full font-medium ${
                          hasLife ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {hasLife ? 'Lifetime' : 'Ordinary'}
                        </span>
                      </div>
                      {c.business_sector && <p className="text-sm text-gray-500 mt-0.5">{c.business_sector}</p>}
                      {c.business_size && (
                        <div className="mt-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.business_size}</span>
                        </div>
                      )}
                    </button>
                  </FadeCard>
                )
              })}
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

      {/* ── Company detail sheet ── */}
      {selected && typeof document !== 'undefined' && createPortal(
        <div
          ref={backdropEl}
          className="fixed inset-0 flex items-end justify-center"
          style={{
            zIndex: 9999,
            backgroundColor: sheetVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
            transition: 'background-color 0.3s ease',
          }}
          onClick={closeSheet}
        >
          <div
            ref={sheetEl}
            className="w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: '#fff',
              transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={e => e.stopPropagation()}
            onTouchStart={onSheetTouchStart}
            onTouchMove={onSheetTouchMove}
            onTouchEnd={onSheetTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="px-6 pb-10 space-y-5">
              {/* Company header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xl font-bold text-gray-900 leading-tight">{selected.business_name}</p>
                  {(() => {
                    const hasLife = selected.members.some(m => m.membership_type === 'Life')
                    return (
                      <span className={`flex-none text-xs px-2.5 py-1 rounded-full font-semibold ${
                        hasLife ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {hasLife ? 'Lifetime' : 'Ordinary'}
                      </span>
                    )
                  })()}
                </div>
                {selected.business_sector && (
                  <p className="text-sm text-gray-500 mt-1">{selected.business_sector}</p>
                )}
                {selected.business_size && (
                  <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {selected.business_size}
                  </span>
                )}
              </div>

              {/* Members */}
              <div className="space-y-4">
                {selected.members.map(m => {
                  const displayEmail = m.email && !m.email.includes('@smelabuan.noemail') ? m.email : null
                  return (
                    <div key={m.id} className="border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="font-semibold text-gray-900 text-sm">{m.full_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.membership_type === 'Life' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {m.membership_type === 'Life' ? 'Lifetime' : (m.membership_type ?? 'Ordinary')}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {m.phone ? (
                          <a
                            href={`tel:${m.phone.replace(/\s/g, '')}`}
                            className="flex items-center gap-3 text-sm text-gray-700 active:opacity-70"
                          >
                            <span className="flex-none w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.48 2 2 0 0 1 3.62 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                            </span>
                            <span>{m.phone}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                            <span className="flex-none w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.48 2 2 0 0 1 3.62 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                            </span>
                            <span>No phone</span>
                          </div>
                        )}
                        {displayEmail ? (
                          <a
                            href={`mailto:${displayEmail}`}
                            className="flex items-center gap-3 text-sm text-gray-700 active:opacity-70"
                          >
                            <span className="flex-none w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                              </svg>
                            </span>
                            <span className="break-all">{displayEmail}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 text-sm text-gray-300">
                            <span className="flex-none w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                              </svg>
                            </span>
                            <span>No email</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}
