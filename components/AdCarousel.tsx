'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Advertisement } from '@/lib/types'

export default function AdCarousel({ ads }: { ads: Advertisement[] }) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'right' | 'left'>('right')
  const [modal, setModal] = useState<Advertisement | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Direct DOM refs for the modal sheet drag — avoids re-renders on every touchmove frame
  const sheetEl = useRef<HTMLDivElement>(null)
  const backdropEl = useRef<HTMLDivElement>(null)
  const sheetDragStartY = useRef(0)
  const sheetDragOffset = useRef(0)

  // Carousel horizontal swipe refs
  const carouselTouchStartX = useRef(0)
  const carouselTouchStartY = useRef(0)

  // Prevent iOS pull-to-refresh while the sheet is being dragged down
  useEffect(() => {
    if (!modal) return
    const el = sheetEl.current
    if (!el) return
    function block(e: TouchEvent) {
      const dy = e.touches[0].clientY - sheetDragStartY.current
      if (dy > 0 && e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [modal])

  const goTo = useCallback((next: number, dir: 'right' | 'left') => {
    if (animating || next === current) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrent(next)
      setAnimating(false)
    }, 350)
  }, [animating, current])

  const goNext = useCallback(() => goTo((current + 1) % ads.length, 'right'), [goTo, current, ads.length])
  const goPrev = useCallback(() => goTo((current - 1 + ads.length) % ads.length, 'left'), [goTo, current, ads.length])

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (ads.length > 1) timerRef.current = setInterval(goNext, 7000)
  }

  useEffect(() => {
    if (ads.length <= 1) return
    timerRef.current = setInterval(goNext, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [goNext, ads.length])

  function openModal(ad: Advertisement) {
    setModal(ad)
    setTimeout(() => setModalVisible(true), 10)
  }

  function closeModal() {
    setModalVisible(false)
    setTimeout(() => setModal(null), 300)
  }

  // ── Carousel horizontal swipe ─────────────────────────────────────────────
  function onCarouselTouchStart(e: React.TouchEvent) {
    carouselTouchStartX.current = e.touches[0].clientX
    carouselTouchStartY.current = e.touches[0].clientY
  }

  function onCarouselTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - carouselTouchStartX.current
    const dy = e.changedTouches[0].clientY - carouselTouchStartY.current
    // Only treat as horizontal swipe when it clearly dominates vertical movement
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? goNext() : goPrev()  // swipe left → next, swipe right → prev
      resetTimer()
    }
  }

  // ── Modal sheet swipe-to-dismiss ───────────────────────────────────────────
  function onSheetTouchStart(e: React.TouchEvent) {
    sheetDragStartY.current = e.touches[0].clientY
    sheetDragOffset.current = 0
  }

  function onSheetTouchMove(e: React.TouchEvent) {
    const delta = Math.max(0, e.touches[0].clientY - sheetDragStartY.current)
    sheetDragOffset.current = delta
    if (sheetEl.current) {
      sheetEl.current.style.transition = 'none'
      sheetEl.current.style.transform = `translateY(${delta}px)`
    }
    if (backdropEl.current) {
      const opacity = Math.max(0, 0.65 * (1 - delta / 350))
      backdropEl.current.style.backgroundColor = `rgba(0,0,0,${opacity.toFixed(2)})`
    }
  }

  function onSheetTouchEnd() {
    const offset = sheetDragOffset.current
    sheetDragOffset.current = 0

    if (offset > 80) {
      // Flick off screen then unmount
      if (sheetEl.current) {
        sheetEl.current.style.transition = 'transform 0.25s ease'
        sheetEl.current.style.transform = 'translateY(110%)'
      }
      if (backdropEl.current) {
        backdropEl.current.style.transition = 'background-color 0.25s ease'
        backdropEl.current.style.backgroundColor = 'rgba(0,0,0,0)'
      }
      setTimeout(() => {
        setModal(null)
        setModalVisible(false)
      }, 250)
    } else {
      // Snap back
      if (sheetEl.current) {
        sheetEl.current.style.transition = 'transform 0.3s ease'
        sheetEl.current.style.transform = 'translateY(0)'
      }
      if (backdropEl.current) {
        backdropEl.current.style.transition = 'background-color 0.3s ease'
        backdropEl.current.style.backgroundColor = 'rgba(0,0,0,0.65)'
      }
    }
  }

  if (!ads.length) return null

  const ad = ads[current]

  const slideStyle: React.CSSProperties = animating
    ? {
        opacity: 0,
        transform: `translateX(${direction === 'right' ? '-30px' : '30px'})`,
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }
    : {
        opacity: 1,
        transform: 'translateX(0)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }

  return (
    <>
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Advertisement</p>

        {/* Card — touch-action:none so vertical swipe is captured, not the page scroll */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ height: 160, touchAction: 'pan-y' }}
          onTouchStart={onCarouselTouchStart}
          onTouchEnd={onCarouselTouchEnd}
        >
          {ad.image_url ? (
            <img
              key={ad.id}
              src={ad.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transition: 'opacity 0.5s ease' }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
            />
          )}

          <div
            className="absolute inset-0"
            style={{
              background: ad.image_url
                ? 'linear-gradient(135deg, rgba(224,90,78,0.72) 0%, rgba(140,30,20,0.80) 100%)'
                : 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 100%)',
            }}
          />

          {/* Ad badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">Ad</span>
          </div>

          {/* Slide content */}
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-12 text-center"
            style={slideStyle}
          >
            <p className="text-white font-bold text-lg leading-tight mb-1 drop-shadow">{ad.advertiser_name}</p>
            <p className="text-white/85 text-sm mb-4 drop-shadow line-clamp-2">{ad.headline}</p>
            <button
              onClick={() => openModal(ad)}
              className="bg-white/95 text-gray-900 font-bold text-sm px-8 py-2.5 rounded-xl shadow-lg active:scale-90 transition-all duration-150"
            >
              Book now
            </button>
          </div>

          {/* Arrows */}
          {ads.length > 1 && (
            <>
              <button
                onClick={() => { goPrev(); resetTimer() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 rounded-xl flex items-center justify-center text-white text-lg font-bold transition-all active:scale-90"
              >‹</button>
              <button
                onClick={() => { goNext(); resetTimer() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 rounded-xl flex items-center justify-center text-white text-lg font-bold transition-all active:scale-90"
              >›</button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {ads.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-2.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i, i > current ? 'right' : 'left'); resetTimer() }}
                className="rounded-full overflow-hidden transition-all duration-300 relative"
                style={{
                  width: i === current ? 40 : 8,
                  height: 8,
                  backgroundColor: i === current ? '#f0b0aa' : '#d1d5db',
                  flexShrink: 0,
                }}
              >
                {i === current && (
                  <span
                    key={current}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      backgroundColor: '#E05A4E',
                      animation: 'countdown-fill 5s linear forwards',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
        <style>{`
          @keyframes countdown-fill {
            from { width: 0%; }
            to   { width: 100%; }
          }
        `}</style>
      </div>

      {/* Modal — portalled to body, above nav and hero card */}
      {modal && createPortal(
        <div
          ref={backdropEl}
          className="fixed inset-0 flex items-end justify-center"
          style={{
            zIndex: 9999,
            backgroundColor: modalVisible ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)',
            transition: 'background-color 0.3s ease',
          }}
          onClick={closeModal}
        >
          <div
            ref={sheetEl}
            className="w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: '#fff',
              transform: modalVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s ease',
            }}
            onClick={e => e.stopPropagation()}
            onTouchStart={onSheetTouchStart}
            onTouchMove={onSheetTouchMove}
            onTouchEnd={onSheetTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Tall banner */}
            <div className="relative" style={{ height: 260 }}>
              {modal.image_url ? (
                <img
                  src={modal.image_url}
                  alt={modal.advertiser_name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
                />
              )}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-9 h-9 bg-black/30 rounded-full flex items-center justify-center text-white text-xl z-10 active:scale-90 transition-transform"
              >×</button>
            </div>

            {/* Content */}
            <div
              className="relative bg-white rounded-t-3xl px-6 pt-5 pb-8 space-y-3"
              style={{ marginTop: -24 }}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <div>
                <p className="text-gray-900 font-bold text-xl">{modal.advertiser_name}</p>
                <p className="text-gray-500 text-sm mt-0.5">{modal.headline}</p>
              </div>
              {modal.description && (
                <p className="text-gray-700 text-sm leading-relaxed">{modal.description}</p>
              )}
              {modal.period_end && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>📅</span>
                  <span>Valid until {new Date(modal.period_end).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              {modal.link_url ? (
                <a
                  href={modal.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3.5 rounded-2xl text-white font-bold text-center active:scale-95 transition-transform mt-2"
                  style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
                >
                  Book now
                </a>
              ) : (
                <button
                  onClick={closeModal}
                  className="w-full py-3.5 rounded-2xl text-white font-bold active:scale-95 transition-transform mt-2"
                  style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      , document.body)}
    </>
  )
}
