'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Advertisement } from '@/lib/types'

export default function AdCarousel({ ads }: { ads: Advertisement[] }) {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const [animating, setAnimating] = useState(false)
  const [modal, setModal] = useState<Advertisement | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((next: number, dir: 'left' | 'right') => {
    if (animating) return
    setDirection(dir)
    setPrev(current)
    setCurrent(next)
    setAnimating(true)
    setTimeout(() => { setPrev(null); setAnimating(false) }, 400)
  }, [animating, current])

  const goNext = useCallback(() => {
    goTo((current + 1) % ads.length, 'right')
  }, [goTo, current, ads.length])

  const goPrev = useCallback(() => {
    goTo((current - 1 + ads.length) % ads.length, 'left')
  }, [goTo, current, ads.length])

  // Auto-cycle every 7 seconds
  useEffect(() => {
    if (ads.length <= 1) return
    timerRef.current = setInterval(goNext, 7000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [goNext, ads.length])

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (ads.length > 1) timerRef.current = setInterval(goNext, 7000)
  }

  function openModal(ad: Advertisement) {
    setModal(ad)
    setTimeout(() => setModalVisible(true), 10)
  }

  function closeModal() {
    setModalVisible(false)
    setTimeout(() => setModal(null), 300)
  }

  if (!ads.length) return null

  const ad = ads[current]
  const prevAd = prev !== null ? ads[prev] : null
  const bgColor = '#E05A4E'

  // Slide direction classes
  const enterClass = direction === 'right' ? 'translate-x-full' : '-translate-x-full'
  const exitClass = direction === 'right' ? '-translate-x-full' : 'translate-x-full'

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInLeft  { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        @keyframes slideOutLeft  { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-100%); opacity: 0; } }
        @keyframes fadeSlideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse-ring { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.5; } }
        .ad-enter-right { animation: slideInRight 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .ad-enter-left  { animation: slideInLeft  0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .ad-exit-right  { animation: slideOutRight 0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .ad-exit-left   { animation: slideOutLeft  0.4s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .ad-content     { animation: fadeSlideUp 0.5s ease forwards; }
        .dot-active     { animation: pulse-ring 2s ease-in-out infinite; }
      `}</style>

      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Advertisement</p>

        {/* Card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)`,
            minHeight: 140,
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10 bg-white" />

          {/* Slide container */}
          <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 140 }}>

            {/* Exiting slide */}
            {prevAd && animating && (
              <div
                key={`prev-${prev}`}
                className={`absolute inset-0 ${direction === 'right' ? 'ad-exit-left' : 'ad-exit-right'}`}
              >
                <SlideContent ad={prevAd} onBook={openModal} />
              </div>
            )}

            {/* Entering slide */}
            <div
              key={`curr-${current}`}
              className={animating ? (direction === 'right' ? 'ad-enter-right' : 'ad-enter-left') : ''}
            >
              <SlideContent ad={ad} onBook={(a) => { openModal(a) }} />
            </div>
          </div>

          {/* Ad badge */}
          <div className="absolute top-3 right-3 z-20">
            <span className="bg-black/30 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">Ad</span>
          </div>

          {/* Left arrow */}
          {ads.length > 1 && (
            <button
              onClick={() => { goPrev(); resetTimer() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-xl flex items-center justify-center text-white text-lg font-bold transition-all active:scale-90"
            >
              ‹
            </button>
          )}

          {/* Right arrow */}
          {ads.length > 1 && (
            <button
              onClick={() => { goNext(); resetTimer() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-xl flex items-center justify-center text-white text-lg font-bold transition-all active:scale-90"
            >
              ›
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {ads.length > 1 && (
          <div className="flex justify-center gap-2 mt-2.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i, i > current ? 'right' : 'left'); resetTimer() }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 20 : 8,
                  height: 8,
                  backgroundColor: i === current ? '#E05A4E' : '#d1d5db',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center transition-all duration-300"
          style={{ backgroundColor: modalVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl transition-transform duration-300"
            style={{
              backgroundColor: '#ffffff',
              transform: modalVisible ? 'translateY(0)' : 'translateY(100%)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Banner */}
            <div
              className="relative h-48"
              style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
            >
              {modal.image_url && (
                <img src={modal.image_url} alt={modal.advertiser_name} className="w-full h-full object-cover" />
              )}
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 bg-white" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10 bg-white" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white text-lg leading-none z-10"
              >
                ×
              </button>
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <p className="text-white font-bold text-xl">{modal.advertiser_name}</p>
                <p className="text-white/80 text-sm">{modal.headline}</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
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
                  className="block w-full py-3.5 rounded-2xl text-white font-bold text-center active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
                >
                  Book now
                </a>
              ) : (
                <button
                  onClick={closeModal}
                  className="w-full py-3.5 rounded-2xl text-white font-bold active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SlideContent({ ad, onBook }: { ad: Advertisement; onBook: (ad: Advertisement) => void }) {
  return (
    <div className="relative px-12 py-6 text-center ad-content">
      {ad.image_url && (
        <img
          src={ad.image_url}
          alt={ad.advertiser_name}
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
      )}
      <div className="relative z-10">
        <p className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-sm">{ad.advertiser_name}</p>
        <p className="text-white/85 text-sm mb-4">{ad.headline}</p>
        <button
          onClick={() => onBook(ad)}
          className="bg-white text-gray-900 font-bold text-sm px-8 py-2.5 rounded-xl shadow-md active:scale-95 transition-transform"
        >
          Book now
        </button>
      </div>
    </div>
  )
}
