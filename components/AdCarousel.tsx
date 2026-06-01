'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Advertisement } from '@/lib/types'

export default function AdCarousel({ ads }: { ads: Advertisement[] }) {
  const [current, setCurrent] = useState(0)
  const [modal, setModal] = useState<Advertisement | null>(null)

  const next = useCallback(() => setCurrent(i => (i + 1) % ads.length), [ads.length])
  const prev = () => setCurrent(i => (i - 1 + ads.length) % ads.length)

  // Auto-cycle every 7 seconds
  useEffect(() => {
    if (ads.length <= 1) return
    const t = setInterval(next, 7000)
    return () => clearInterval(t)
  }, [next, ads.length])

  if (!ads.length) return null

  const ad = ads[current]
  const bgColor = ad.bg_color ?? '#2d6a4f'

  return (
    <>
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Advertisement</p>

        <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: bgColor }}>
          {/* Background image */}
          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.advertiser_name}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}

          {/* Ad badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-black/40 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">Ad</span>
          </div>

          {/* Content */}
          <div className="relative z-10 px-12 py-6 text-center">
            <p className="text-white font-bold text-lg leading-tight mb-1">{ad.advertiser_name}</p>
            <p className="text-white/80 text-sm mb-4">{ad.headline}</p>
            <button
              onClick={() => setModal(ad)}
              className="bg-white text-gray-900 font-bold text-sm px-8 py-2.5 rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
            >
              Book now
            </button>
          </div>

          {/* Left arrow */}
          {ads.length > 1 && (
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-xl flex items-center justify-center text-white transition-colors"
            >
              ‹
            </button>
          )}

          {/* Right arrow */}
          {ads.length > 1 && (
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-xl flex items-center justify-center text-white transition-colors"
            >
              ›
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {ads.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: i === current ? '#E05A4E' : '#d1d5db' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: '#ffffff' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Banner */}
            <div className="relative h-48" style={{ backgroundColor: modal.bg_color ?? '#2d6a4f' }}>
              {modal.image_url && (
                <img src={modal.image_url} alt={modal.advertiser_name} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button
                onClick={() => setModal(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white text-lg leading-none"
              >
                ×
              </button>
              <div className="absolute bottom-4 left-4 right-4">
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
                  className="block w-full py-3.5 rounded-2xl text-white font-bold text-center transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#E05A4E' }}
                >
                  Book now
                </a>
              ) : (
                <button
                  onClick={() => setModal(null)}
                  className="w-full py-3.5 rounded-2xl text-white font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#E05A4E' }}
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
