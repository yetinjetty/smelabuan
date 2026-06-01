'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Advertisement } from '@/lib/types'

export default function AdCarousel({ ads }: { ads: Advertisement[] }) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'right' | 'left'>('right')
  const [modal, setModal] = useState<Advertisement | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    timerRef.current = setInterval(goNext, 7000)
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

        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>

          {/* Adaptive background image */}
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

          {/* Dark + red transparency overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: ad.image_url
                ? 'linear-gradient(135deg, rgba(224,90,78,0.72) 0%, rgba(140,30,20,0.80) 100%)'
                : 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 100%)',
              backdropFilter: ad.image_url ? 'blur(0px)' : undefined,
            }}
          />


          {/* Ad badge */}
          <div className="absolute top-3 right-3 z-20">
            <span className="bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">Ad</span>
          </div>

          {/* Slide content */}
          <div className="relative z-10 px-12 py-7 text-center" style={slideStyle}>
            <p className="text-white font-bold text-lg leading-tight mb-1 drop-shadow">{ad.advertiser_name}</p>
            <p className="text-white/85 text-sm mb-5 drop-shadow">{ad.headline}</p>
            <button
              onClick={() => openModal(ad)}
              className="bg-white/95 text-gray-900 font-bold text-sm px-8 py-2.5 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              Book now
            </button>
          </div>

          {/* Arrows */}
          {ads.length > 1 && (
            <>
              <button
                onClick={() => { goPrev(); resetTimer() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 hover:bg-black/40 rounded-xl flex items-center justify-center text-white text-lg font-bold transition-all active:scale-90"
              >‹</button>
              <button
                onClick={() => { goNext(); resetTimer() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 hover:bg-black/40 rounded-xl flex items-center justify-center text-white text-lg font-bold transition-all active:scale-90"
              >›</button>
            </>
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

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center transition-all duration-300"
          style={{ backgroundColor: modalVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl transition-transform duration-300"
            style={{
              backgroundColor: '#fff',
              transform: modalVisible ? 'translateY(0)' : 'translateY(100%)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Banner — clean image, no overlay */}
            <div className="relative overflow-hidden">
              {modal.image_url ? (
                <img src={modal.image_url} alt={modal.advertiser_name} className="w-full object-cover" style={{ maxHeight: 220 }} />
              ) : (
                <div className="h-32" style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }} />
              )}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white text-lg z-10"
              >×</button>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Title below image, not on top of it */}
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
