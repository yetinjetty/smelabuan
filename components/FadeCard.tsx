'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Cards fly in from below with a spring overshoot on enter,
 * and fade-slide out on leave.
 */
export default function FadeCard({ children }: { children: React.ReactNode }) {
  const ref   = useRef<HTMLDivElement>(null)
  const [vis,   setVis]   = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVis(entry.isIntersecting),
      { threshold: 0.06 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const entered = !ready || vis

  return (
    <div
      ref={ref}
      style={{
        opacity:   entered ? 1 : 0,
        transform: entered
          ? 'translateY(0px) scale(1)'
          : 'translateY(60px) scale(0.88)',
        transition: ready
          // spring curve: slight overshoot gives the "fly in" snap feel
          ? 'opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'none',
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  )
}
