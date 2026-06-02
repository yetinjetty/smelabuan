'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Announcement } from '@/lib/types'

// ── Count-up — only starts when `ready` flips to true ───────────────────────
function useCountUp(target: number, ready: boolean, duration = 1200) {
  const [count, setCount] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (!ready || done.current) return
    done.current = true
    const start = performance.now()
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1)
      setCount(Math.round(target * (1 - Math.pow(1 - p, 3)))) // ease-out cubic
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [ready, target, duration])
  return count
}

const LS_KEY = 'sme_read_announcements'

export default function HomeWidgets({
  memberCount,
  announcements,
}: {
  memberCount: number
  announcements: Announcement[]
}) {
  const router = useRouter()

  // ── Count-up timing: wait for splash screen on first visit / reload ────────
  const [countReady, setCountReady] = useState(false)
  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const isReload    = nav?.type === 'reload'
    const alreadySeen = !!sessionStorage.getItem('sme_splashed')
    const splashShowing = isReload || !alreadySeen
    if (!splashShowing) { setCountReady(true); return }
    function onDone() { setCountReady(true) }
    window.addEventListener('smesplashdone', onDone, { once: true })
    return () => window.removeEventListener('smesplashdone', onDone)
  }, [])

  const animCount = useCountUp(memberCount, countReady)

  // ── Notification sheet state ───────────────────────────────────────────────
  const [notifOpen, setNotifOpen]       = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [readIds, setReadIds]           = useState<Set<string>>(new Set())

  const sheetEl    = useRef<HTMLDivElement>(null)
  const backdropEl = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragOffset = useRef(0)

  // Non-passive touchmove so we can call preventDefault during the drag
  useEffect(() => {
    if (!notifOpen) return
    const el = sheetEl.current
    if (!el) return
    function block(e: TouchEvent) {
      const dy = e.touches[0].clientY - dragStartY.current
      if (dy > 0 && e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [notifOpen])

  // Load read IDs from localStorage after mount
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_KEY)
      if (s) setReadIds(new Set(JSON.parse(s)))
    } catch { /* ignore */ }
  }, [])

  function openNotif() {
    setNotifOpen(true)
    setTimeout(() => setSheetVisible(true), 10)
  }

  function closeNotif() {
    setSheetVisible(false)
    setTimeout(() => setNotifOpen(false), 300)
  }

  // ── Swipe-to-dismiss ───────────────────────────────────────────────────────
  function onSheetTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
    dragOffset.current = 0
  }

  function onSheetTouchMove(e: React.TouchEvent) {
    const delta = Math.max(0, e.touches[0].clientY - dragStartY.current)
    dragOffset.current = delta
    if (sheetEl.current) {
      sheetEl.current.style.transition = 'none'
      sheetEl.current.style.transform  = `translateY(${delta}px)`
    }
    if (backdropEl.current) {
      const opacity = Math.max(0, 0.5 * (1 - delta / 300))
      backdropEl.current.style.backgroundColor = `rgba(0,0,0,${opacity.toFixed(2)})`
    }
  }

  function onSheetTouchEnd() {
    const offset = dragOffset.current
    dragOffset.current = 0
    if (offset > 80) {
      if (sheetEl.current) {
        sheetEl.current.style.transition = 'transform 0.25s ease'
        sheetEl.current.style.transform  = 'translateY(110%)'
      }
      if (backdropEl.current) {
        backdropEl.current.style.transition = 'background-color 0.25s ease'
        backdropEl.current.style.backgroundColor = 'rgba(0,0,0,0)'
      }
      setTimeout(() => { setNotifOpen(false); setSheetVisible(false) }, 250)
    } else {
      if (sheetEl.current) {
        sheetEl.current.style.transition = 'transform 0.3s ease'
        sheetEl.current.style.transform  = 'translateY(0)'
      }
      if (backdropEl.current) {
        backdropEl.current.style.transition = 'background-color 0.3s ease'
        backdropEl.current.style.backgroundColor = 'rgba(0,0,0,0.5)'
      }
    }
  }

  // ── Read state helpers ─────────────────────────────────────────────────────
  function markRead(id: string) {
    const next = new Set(readIds); next.add(id)
    setReadIds(next)
    try { localStorage.setItem(LS_KEY, JSON.stringify([...next])) } catch { /**/ }
  }

  function markAllRead() {
    const next = new Set(announcements.map(a => a.id))
    setReadIds(next)
    try { localStorage.setItem(LS_KEY, JSON.stringify([...next])) } catch { /**/ }
  }

  const unread = announcements.filter(a => !readIds.has(a.id)).length

  return (
    <>
      <div className="grid grid-cols-2 gap-3">

        {/* ── Members widget ── */}
        <button
          onClick={() => router.push('/directory')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left active:scale-95 transition-transform duration-150"
        >
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Members</p>
          <p
            className="text-4xl font-extrabold leading-none"
            style={{ color: '#E05A4E', textShadow: '0 2px 12px rgba(224,90,78,0.25)' }}
          >
            {animCount}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">active members</p>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium" style={{ color: '#E05A4E' }}>
            View directory
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </button>

        {/* ── Notifications widget ── */}
        <button
          onClick={openNotif}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left active:scale-95 transition-transform duration-150"
        >
          <div className="flex items-start justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Notifications</p>
            {unread > 0 && (
              <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full leading-none" style={{ backgroundColor: '#E05A4E' }}>
                {unread}
              </span>
            )}
          </div>
          <p className="text-4xl font-extrabold leading-none text-gray-800">{announcements.length}</p>
          <p className="text-xs text-gray-400 mt-1.5">{unread > 0 ? `${unread} unread` : 'all read'}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-400">
            Tap to view
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </button>
      </div>

      {/* ── Notification sheet ── */}
      {notifOpen && (
        <div
          ref={backdropEl}
          className="fixed inset-0 flex items-end justify-center z-[500]"
          style={{
            backgroundColor: sheetVisible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
            transition: 'background-color 0.3s ease',
          }}
          onClick={closeNotif}
        >
          <div
            ref={sheetEl}
            className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl overflow-hidden"
            style={{
              transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              maxHeight: '78vh',
            }}
            onClick={e => e.stopPropagation()}
            onTouchStart={onSheetTouchStart}
            onTouchMove={onSheetTouchMove}
            onTouchEnd={onSheetTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unread > 0 && (
                  <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full leading-none" style={{ backgroundColor: '#E05A4E' }}>
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium" style={{ color: '#E05A4E' }}>
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto px-4 pt-3 pb-10 space-y-2" style={{ maxHeight: 'calc(78vh - 100px)' }}>
              {announcements.length === 0 && (
                <p className="text-center text-gray-400 py-16 text-sm">No notifications yet</p>
              )}
              {announcements.map(a => {
                const isRead = readIds.has(a.id)
                return (
                  <div
                    key={a.id}
                    className={`rounded-2xl p-4 border transition-colors ${isRead ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="flex-none mt-1.5 w-2 h-2 rounded-full transition-all"
                        style={{
                          backgroundColor: isRead ? 'transparent' : '#E05A4E',
                          boxShadow: isRead ? 'none' : '0 0 6px rgba(224,90,78,0.5)',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-snug ${isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                            {a.title}
                          </p>
                          {!isRead && (
                            <button onClick={() => markRead(a.id)} className="flex-none text-[11px] text-gray-400 underline whitespace-nowrap">
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.body}</p>
                        {a.published_at && (
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            {format(new Date(a.published_at), 'd MMM yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
