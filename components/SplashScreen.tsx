'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type Phase = 'enter' | 'blink' | 'zoom' | 'hidden'

export default function SplashScreen() {
  // Start visible so the white screen covers page content the instant the layout mounts
  const [phase, setPhase] = useState<Phase>('enter')

  useEffect(() => {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const isReload   = navEntry?.type === 'reload'
    const isNavigate = !navEntry || navEntry.type === 'navigate'
    const alreadySeen = !!sessionStorage.getItem('sme_splashed')

    // Show on: first login (navigate, not yet seen) OR any refresh
    if (!isReload && alreadySeen && !isNavigate) {
      setPhase('hidden')
      return
    }
    if (!isReload && alreadySeen) {
      // Hard navigate back to member area after already seeing it this session → hide instantly
      setPhase('hidden')
      return
    }

    // Run the animation
    const t1 = setTimeout(() => setPhase('blink'), 300)   // fade-in done → blink
    const t2 = setTimeout(() => setPhase('zoom'),  1500)  // blink done  → zoom + fade
    const t3 = setTimeout(() => {
      setPhase('hidden')
      sessionStorage.setItem('sme_splashed', '1')
    }, 2050)                                               // animation complete

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'hidden') return null

  const isZooming = phase === 'zoom'

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-white"
      style={{
        opacity: isZooming ? 0 : 1,
        transition: isZooming ? 'opacity 0.55s ease-in' : 'none',
        pointerEvents: isZooming ? 'none' : 'all',
      }}
    >
      <div
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: isZooming ? 'scale(6)' : 'scale(1)',
          transition: phase === 'enter'
            ? 'opacity 0.3s ease-out'
            : isZooming
              ? 'transform 0.55s ease-in, opacity 0.55s ease-in'
              : 'none',
          animation: phase === 'blink' ? 'splash-blink 0.4s ease-in-out 3' : 'none',
        }}
      >
        <Image
          src="/SMEA Labuan Logo v1.png"
          alt="SMELA Labuan"
          width={180}
          height={136}
          className="object-contain"
          priority
        />
      </div>

      <style>{`
        @keyframes splash-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
