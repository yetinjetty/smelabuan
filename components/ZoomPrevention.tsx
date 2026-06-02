'use client'

import { useEffect } from 'react'

export default function ZoomPrevention() {
  useEffect(() => {
    // iOS Safari fires proprietary gesture events for multi-touch pinch.
    // Calling preventDefault() on them stops the zoom regardless of the
    // viewport meta tag (which iOS 10+ ignores for accessibility).
    function block(e: Event) { e.preventDefault() }

    document.addEventListener('gesturestart',  block, { passive: false })
    document.addEventListener('gesturechange', block, { passive: false })
    document.addEventListener('gestureend',    block, { passive: false })

    // Also block ctrl+wheel zoom on desktop browsers
    function blockCtrlWheel(e: WheelEvent) {
      if (e.ctrlKey) e.preventDefault()
    }
    document.addEventListener('wheel', blockCtrlWheel, { passive: false })

    return () => {
      document.removeEventListener('gesturestart',  block)
      document.removeEventListener('gesturechange', block)
      document.removeEventListener('gestureend',    block)
      document.removeEventListener('wheel', blockCtrlWheel)
    }
  }, [])

  return null
}
