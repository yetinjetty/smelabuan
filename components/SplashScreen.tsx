'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type Phase = 'loading' | 'enter' | 'blink' | 'zoom' | 'hidden'

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    // Skip if already shown this login session
    if (sessionStorage.getItem('sme_splashed')) {
      setPhase('hidden')
      return
    }

    // Start the sequence
    setPhase('enter')

    const t1 = setTimeout(() => setPhase('blink'), 300)          // logo fades in → start blinking
    const t2 = setTimeout(() => setPhase('zoom'), 1500)           // blink done → zoom + fade
    const t3 = setTimeout(() => {
      setPhase('hidden')
      sessionStorage.setItem('sme_splashed', '1')
    }, 2050)                                                       // unmount after zoom completes

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'loading' || phase === 'hidden') return null

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
          animation: phase === 'blink'
            ? 'splash-blink 0.4s ease-in-out 3'
            : 'none',
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
