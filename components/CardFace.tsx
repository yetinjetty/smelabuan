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

// Samples the bottom 40% of the image (where text lives) and returns
// 'white' or 'black' based on average relative luminance.
function useAdaptiveTextColor(imageUrl: string): 'white' | 'black' {
  const [color, setColor] = useState<'white' | 'black'>('white')

  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Downscale for speed, then crop bottom 40%
        const scale = 100 / img.width
        const sw = 100
        const sh = Math.round(img.height * scale)
        canvas.width = sw
        canvas.height = sh
        ctx.drawImage(img, 0, 0, sw, sh)

        const cropY = Math.floor(sh * 0.6)
        const { data } = ctx.getImageData(0, cropY, sw, sh - cropY)

        let total = 0
        for (let i = 0; i < data.length; i += 4) {
          // sRGB relative luminance (WCAG)
          const r = data[i] / 255
          const g = data[i + 1] / 255
          const b = data[i + 2] / 255
          total += 0.2126 * r + 0.7152 * g + 0.0722 * b
        }

        const avg = total / (data.length / 4)
        setColor(avg > 0.5 ? 'black' : 'white')
      } catch {
        setColor('white') // canvas tainted or unavailable
      }
    }

    img.onerror = () => setColor('white')
    img.src = imageUrl
  }, [imageUrl])

  return color
}

export default function CardFace({
  fullName, businessName, memberId, membershipType, expiryDate, backgroundImage,
}: Props) {
  const textColor = useAdaptiveTextColor(backgroundImage)
  const light = textColor === 'black'
  const isLifetime = membershipType === 'Life'

  // Contrasting halo so text stays legible over busy / mid-tone areas
  const textShadow = light
    ? '0 1px 3px rgba(255,255,255,0.9), 0 0 2px rgba(255,255,255,0.9)'
    : '0 1px 4px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.6)'

  return (
    <div
      className="w-full max-w-xs rounded-3xl p-7 shadow-none hover:shadow-2xl active:shadow-2xl transition-shadow duration-200 flex flex-col justify-between relative overflow-hidden"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        aspectRatio: '1 / 1.586',
      }}
    >
      {/* Top: logo */}
      <div className="relative">
        <Image
          src="/SMEA Labuan Logo v1.png"
          alt="SMEA Labuan"
          width={72}
          height={54}
          className="object-contain"
        />
      </div>

      {/* Spacer */}
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
    </div>
  )
}
