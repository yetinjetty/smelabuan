'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Wraps any card with a fade-in / fade-out animation driven by
 * IntersectionObserver. Cards fade in as they enter the viewport and
 * fade out once they scroll fully out of view.
 */
export default function FadeCard({ children }: { children: React.ReactNode }) {
  const ref     = useRef<HTMLDivElement>(null)
  const [vis, setVis]     = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVis(entry.isIntersecting),
      { threshold: 0.05 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity:    !ready || vis ? 1 : 0,
        transform:  !ready || vis ? 'translateY(0)' : 'translateY(10px)',
        transition: ready ? 'opacity 0.3s ease, transform 0.3s ease' : 'none',
      }}
    >
      {children}
    </div>
  )
}
