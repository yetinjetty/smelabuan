'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'

interface Background {
  src: string
  isStatic?: boolean
}

interface Props {
  fullName: string
  businessName: string | null
  memberId: string | null
  membershipType: string | null
  expiryDate: string | null
  backgroundImage: string
  backgrounds?: Background[]
}

const LS_KEY = 'sme_card_bg'

const CARD_W   = 160
const CARD_GAP = 16

// ── Luminance helpers ────────────────────────────────────────────────────────

function sampleLuminance(
  imageUrl: string,
  cropTopFraction: number,
  cropHeightFraction: number,
  cb: (lum: number) => void,
) {
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
      for (let i = 0; i < data.length; i += 4)
        total += 0.2126 * (data[i] / 255) + 0.7152 * (data[i + 1] / 255) + 0.0722 * (data[i + 2] / 255)
      cb(total / (data.length / 4))
    } catch { cb(0) }
  }
  img.onerror = () => cb(0)
  img.src = imageUrl
}

function useAdaptiveTextColor(imageUrl: string): 'white' | 'black' {
  const [color, setColor] = useState<'white' | 'black'>('white')
  useEffect(() => {
    sampleLuminance(imageUrl, 0.6, 0.4, lum => setColor(lum > 0.5 ? 'black' : 'white'))
  }, [imageUrl])
  return color
}

function useLogoDark(imageUrl: string): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    sampleLuminance(imageUrl, 0, 0.25, lum => setDark(lum < 0.4))
  }, [imageUrl])
  return dark
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CardFace({
  fullName, businessName, memberId, membershipType, expiryDate,
  backgroundImage, backgrounds: bgProp,
}: Props) {
  const backgrounds = bgProp ?? []

  const [bg, setBg]                 = useState(backgroundImage)
  const [pickerOpen, setPickerOpen]   = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [pending, setPending]         = useState(bg)

  const sheetEl    = useRef<HTMLDivElement>(null)
  const backdropEl = useRef<HTMLDivElement>(null)
  const carouselEl = useRef<HTMLDivElement>(null)
  const dragStartY  = useRef(0)
  const dragOffset  = useRef(0)

  // Restore saved choice, fall back to first available background
  useEffect(() => {
    if (backgrounds.length === 0) { setBg(''); return }
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved && backgrounds.some(b => b.src === saved)) { setBg(saved); return }
    } catch { /* ignore */ }
    setBg(backgrounds[0].src)
  }, [backgrounds])

  // Non-passive touchmove to block page scroll while dragging sheet down
  useEffect(() => {
    if (!pickerOpen) return
    const el = sheetEl.current
    if (!el) return
    function block(e: TouchEvent) {
      const dy = e.touches[0].clientY - dragStartY.current
      if (dy > 0 && e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [pickerOpen])

  // Scroll carousel to current selection when picker opens
  useEffect(() => {
    if (!pickerOpen) return
    const t = setTimeout(() => {
      const el = carouselEl.current
      if (!el) return
      const idx = backgrounds.findIndex(b => b.src === pending)
      if (idx > 0) {
        // Each card is CARD_W + CARD_GAP wide; centred padding is (50% - 80px) on left
        el.scrollTo({ left: idx * (CARD_W + CARD_GAP), behavior: 'instant' })
      }
    }, 120) // wait for sheet animation
    return () => clearTimeout(t)
  }, [pickerOpen, pending, backgrounds])

  const textColor  = useAdaptiveTextColor(bg)
  const logoDark   = useLogoDark(bg)
  const light      = textColor === 'black'
  const isLifetime = membershipType === 'Life'

  const textShadow = light
    ? '0 2px 6px rgba(255,255,255,1), 0 0 4px rgba(255,255,255,1), 0 0 12px rgba(255,255,255,0.8)'
    : '0 2px 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.85), 0 0 14px rgba(0,0,0,0.6)'
  const subTextShadow = light
    ? '-1px -1px 0 rgba(255,255,255,0.95), 1px -1px 0 rgba(255,255,255,0.95), -1px 1px 0 rgba(255,255,255,0.95), 1px 1px 0 rgba(255,255,255,0.95), 0 0 10px rgba(255,255,255,1)'
    : '-1px -1px 0 rgba(0,0,0,0.9), 1px -1px 0 rgba(0,0,0,0.9), -1px 1px 0 rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.95), 0 2px 12px rgba(0,0,0,0.8)'

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

  // ── Sheet swipe-to-dismiss ───────────────────────────────────────────────
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
      setTimeout(() => { setPickerOpen(false); setSheetVisible(false) }, 250)
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

  return (
    <>
      {/* Card */}
      <button
        onClick={openPicker}
        className="w-full max-w-xs rounded-3xl p-7 shadow-none hover:shadow-2xl active:shadow-2xl active:scale-[0.99] transition-all duration-200 flex flex-col justify-between relative overflow-hidden text-left"
        style={{
          backgroundImage: bg ? `url('${bg}')` : 'linear-gradient(160deg, #E05A4E 0%, #c0392b 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          aspectRatio: '1 / 1.586',
        }}
      >
        {/* Top row: logo + member ID */}
        <div className="relative flex items-start justify-between">
          <div className={`transition-all duration-300 ${logoDark ? 'bg-white rounded-xl px-2 py-1.5' : ''}`}>
            <Image src="/SMEA Labuan Logo v1.png" alt="SMEA Labuan" width={72} height={54} className="object-contain" />
          </div>
          <p className={`text-sm font-mono font-bold tracking-widest ${light ? 'text-gray-900' : 'text-white'}`} style={{ textShadow }}>
            {memberId}
          </p>
        </div>

        <div className="flex-1" />

        {/* Bottom: name / company / expiry + badge */}
        <div className="relative flex items-end justify-between">
          <div>
            <p className={`text-2xl font-bold leading-snug ${light ? 'text-gray-900' : 'text-white'}`} style={{ textShadow }}>
              {fullName}
            </p>
            {businessName && (
              <p className={`text-sm mt-4 leading-snug font-medium ${light ? 'text-gray-800' : 'text-white'}`} style={{ textShadow: subTextShadow }}>
                {businessName}
              </p>
            )}
            {expiryDate && (
              <p className={`text-xs mt-1.5 font-medium ${light ? 'text-gray-800' : 'text-white'}`} style={{ textShadow: subTextShadow }}>
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

      <p className="text-xs text-gray-400 mt-2">Tap card to change design</p>

      {/* ── Picker sheet ── */}
      {pickerOpen && (
        <div
          ref={backdropEl}
          className="fixed inset-0 flex items-end justify-center z-[500]"
          style={{
            backgroundColor: sheetVisible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
            transition: 'background-color 0.3s ease',
          }}
          onClick={closePicker}
        >
          <div
            ref={sheetEl}
            className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col"
            style={{
              transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
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

            <div className="px-5 pt-2 pb-4">
              <h3 className="font-bold text-gray-900 text-center">Choose card design</h3>
              <p className="text-xs text-gray-400 text-center mt-0.5">Swipe to browse, then tap Apply</p>
            </div>

            {/* Empty state */}
            {backgrounds.length === 0 && (
              <p className="text-sm text-gray-400 text-center px-6 pb-5">
                No card designs uploaded yet. Ask your admin to upload backgrounds in the Settings page.
              </p>
            )}

            {/* Horizontal tap-to-select carousel */}
            <div
              ref={carouselEl}
              className="flex pb-6"
              style={{
                overflowX: 'scroll',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                gap: CARD_GAP,
                // Centre first & last cards by padding both sides
                paddingLeft: 'calc(50% - 80px)',
                paddingRight: 'calc(50% - 80px)',
              }}
            >
              {backgrounds.map((b) => {
                const isSelected = pending === b.src
                return (
                  <button
                    key={b.src}
                    onClick={() => setPending(b.src)}
                    className="flex-none rounded-2xl overflow-hidden relative"
                    style={{
                      // pan-x tells the browser: horizontal drag = scroll, not button press
                      touchAction: 'pan-x',
                      width: CARD_W,
                      aspectRatio: '1 / 1.586',
                      scrollSnapAlign: 'center',
                      backgroundImage: `url('${b.src}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      // Use outline ring instead of transform so layout is unaffected
                      outline: isSelected ? '4px solid #E05A4E' : '4px solid transparent',
                      outlineOffset: '2px',
                      boxShadow: isSelected
                        ? '0 8px 24px rgba(224,90,78,0.3)'
                        : '0 4px 16px rgba(0,0,0,0.12)',
                      transition: 'outline-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    {isSelected && (
                      <span
                        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: '#E05A4E' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
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
