'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'

interface Props {
  fullName: string
  businessName: string | null
  memberId: string | null
  membershipType: string | null
  expiryDate: string | null
  backgroundImage: string
}

const LS_KEY = 'sme_card_bg'

const BACKGROUNDS = [
  { id: 'card1', src: '/card1.jpg', label: 'Heritage' },
  { id: 'card2', src: '/card2.png', label: 'Coastal' },
]

// Samples a region of the image and returns its average relative luminance (0–1).
function sampleLuminance(imageUrl: string, cropTopFraction: number, cropHeightFraction: number, cb: (lum: number) => void) {
  const img = new window.Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const sw = 100
      const sh = Math.round(img.height * (100 / img.width))
      canvas.width = sw
      canvas.height = sh
      ctx.drawImage(img, 0, 0, sw, sh)
      const y0 = Math.floor(sh * cropTopFraction)
      const h  = Math.max(1, Math.floor(sh * cropHeightFraction))
      const { data } = ctx.getImageData(0, y0, sw, h)
      let total = 0
      for (let i = 0; i < data.length; i += 4) {
        total += 0.2126 * (data[i] / 255) + 0.7152 * (data[i + 1] / 255) + 0.0722 * (data[i + 2] / 255)
      }
      cb(total / (data.length / 4))
    } catch { cb(0) }
  }
  img.onerror = () => cb(0)
  img.src = imageUrl
}

// Bottom 40% → text colour
function useAdaptiveTextColor(imageUrl: string): 'white' | 'black' {
  const [color, setColor] = useState<'white' | 'black'>('white')
  useEffect(() => {
    sampleLuminance(imageUrl, 0.6, 0.4, lum => setColor(lum > 0.5 ? 'black' : 'white'))
  }, [imageUrl])
  return color
}

// Top 25% → whether logo needs a white backing
function useLogoDark(imageUrl: string): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    sampleLuminance(imageUrl, 0, 0.25, lum => setDark(lum < 0.4))
  }, [imageUrl])
  return dark
}

export default function CardFace({
  fullName, businessName, memberId, membershipType, expiryDate, backgroundImage,
}: Props) {
  const [bg, setBg] = useState(backgroundImage)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [pending, setPending] = useState(bg)

  // Load saved choice on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved && BACKGROUNDS.some(b => b.src === saved)) setBg(saved)
    } catch { /* ignore */ }
  }, [])

  const textColor = useAdaptiveTextColor(bg)
  const logoDark = useLogoDark(bg)
  const light = textColor === 'black'
  const isLifetime = membershipType === 'Life'

  const textShadow = light
    ? '0 2px 6px rgba(255,255,255,1), 0 0 4px rgba(255,255,255,1), 0 0 12px rgba(255,255,255,0.8)'
    : '0 2px 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.85), 0 0 14px rgba(0,0,0,0.6)'

  function openPicker() {
    setPending(bg)
    setPickerOpen(true)
    setTimeout(() => setSheetVisible(true), 10)
  }

  function closePicker() {
    setSheetVisible(false)
    setTimeout(() => setPickerOpen(false), 300)
  }

  function apply() {
    setBg(pending)
    try { localStorage.setItem(LS_KEY, pending) } catch { /* ignore */ }
    closePicker()
  }

  return (
    <>
      {/* Card */}
      <button
        onClick={openPicker}
        className="w-full max-w-xs rounded-3xl p-7 shadow-none hover:shadow-2xl active:shadow-2xl active:scale-[0.99] transition-all duration-200 flex flex-col justify-between relative overflow-hidden text-left"
        style={{
          backgroundImage: `url('${bg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          aspectRatio: '1 / 1.586',
        }}
      >
        {/* Top: logo — white pill backing on dark backgrounds */}
        <div className="relative self-start">
          <div className={`transition-all duration-300 ${logoDark ? 'bg-white rounded-xl px-2 py-1.5' : ''}`}>
            <Image
              src="/SMEA Labuan Logo v1.png"
              alt="SMEA Labuan"
              width={72}
              height={54}
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom: name / company / ID / expiry + badge */}
        <div className="relative flex items-end justify-between">
          <div>
            <p className={`text-2xl font-bold leading-snug ${light ? 'text-gray-900' : 'text-white'}`} style={{ textShadow }}>
              {fullName}
            </p>
            {businessName && (
              <p className={`text-sm mt-1 leading-snug ${light ? 'text-gray-700' : 'text-white/80'}`} style={{ textShadow }}>
                {businessName}
              </p>
            )}
            <p className={`text-lg font-mono font-bold tracking-widest mt-3 ${light ? 'text-gray-900' : 'text-white'}`} style={{ textShadow }}>
              {memberId}
            </p>
            {expiryDate && (
              <p className={`text-xs mt-1 ${light ? 'text-gray-700' : 'text-white/80'}`} style={{ textShadow }}>
                Exp {format(new Date(expiryDate), 'MMM yyyy')}
              </p>
            )}
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium self-end mb-0.5 ${
            isLifetime ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isLifetime ? 'Lifetime' : membershipType}
          </span>
        </div>
      </button>

      {/* Hint */}
      <p className="text-xs text-gray-400 mt-2">Tap card to change design</p>

      {/* ── Picker bottom sheet ── */}
      {pickerOpen && (
        <div
          className="fixed inset-0 flex items-end justify-center z-[500]"
          style={{
            backgroundColor: sheetVisible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
            transition: 'background-color 0.3s ease',
          }}
          onClick={closePicker}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{
              transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              maxHeight: '85vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="px-5 pt-2 pb-3">
              <h3 className="font-bold text-gray-900 text-center">Choose card design</h3>
              <p className="text-xs text-gray-400 text-center mt-0.5">Swipe to browse</p>
            </div>

            {/* Vertical swipe list */}
            <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-6 py-2 space-y-5">
              {BACKGROUNDS.map(b => {
                const isSelected = pending === b.src
                return (
                  <button
                    key={b.id}
                    onClick={() => setPending(b.src)}
                    className="block w-full snap-center rounded-2xl overflow-hidden relative transition-all"
                    style={{
                      aspectRatio: '1 / 1.586',
                      backgroundImage: `url('${b.src}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      maxWidth: 240,
                      margin: '0 auto',
                      boxShadow: isSelected ? '0 0 0 4px #E05A4E' : '0 4px 16px rgba(0,0,0,0.12)',
                    }}
                  >
                    {/* Label */}
                    <span className="absolute bottom-3 left-3 text-xs font-semibold text-white px-2.5 py-1 rounded-full bg-black/40">
                      {b.label}
                    </span>
                    {/* Selected check */}
                    {isSelected && (
                      <span
                        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: '#E05A4E' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Apply */}
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={apply}
                className="w-full py-3 rounded-2xl text-white text-sm font-semibold"
                style={{ backgroundColor: '#E05A4E' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
