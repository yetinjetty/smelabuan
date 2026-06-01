'use client'

import { useEffect } from 'react'

// Parse an rgb/rgba string into [r,g,b]
function parseRgb(css: string): [number, number, number] | null {
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  return m ? [+m[1], +m[2], +m[3]] : null
}

// Walk up DOM to find first element that has a non-transparent background
function getBgColor(el: HTMLElement): [number, number, number] {
  let cur: HTMLElement | null = el
  while (cur) {
    const bg = window.getComputedStyle(cur).backgroundColor
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
      const rgb = parseRgb(bg)
      if (rgb) return rgb
    }
    cur = cur.parentElement
  }
  return [224, 90, 78] // fallback to brand red
}

// Lighten a color by blending toward white
function lighten(r: number, g: number, b: number, amount = 0.4): string {
  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)
  return `${lr},${lg},${lb}`
}

export default function TapEffect() {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes _halo {
        0%   { box-shadow: 0 0 0 0px rgba(var(--_hc), 0.55); }
        100% { box-shadow: 0 0 0 14px rgba(var(--_hc), 0); }
      }
      @keyframes _ripple {
        0%   { transform: scale(0); opacity: 0.5; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      ._tapping {
        animation: _halo 0.45s ease-out forwards !important;
        filter: brightness(1.12) !important;
        transform: scale(0.96) !important;
        transition: transform 0.1s ease, filter 0.1s ease !important;
      }
      ._ripple-el {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        animation: _ripple 0.5s ease-out forwards;
        z-index: 999;
      }
    `
    document.head.appendChild(style)

    function onTap(e: TouchEvent | MouseEvent) {
      const touch = e instanceof TouchEvent ? e.touches[0] : e
      const target = (e.target as HTMLElement).closest('button, a') as HTMLElement | null
      if (!target) return
      // Nav bar has its own tap effects — skip to avoid square halo and overflow clipping
      if (target.closest('nav')) return

      const rect = target.getBoundingClientRect()
      const [r, g, b] = getBgColor(target)
      const lightColor = lighten(r, g, b, 0.45)

      // Set halo color CSS variable
      target.style.setProperty('--_hc', lightColor)

      // Ensure relative positioning for ripple child
      const prevPos = window.getComputedStyle(target).position
      if (prevPos === 'static') target.style.position = 'relative'
      const prevOverflow = target.style.overflow
      target.style.overflow = 'hidden'

      // Ripple element — starts at tap point
      const size = Math.max(rect.width, rect.height)
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const ripple = document.createElement('span')
      ripple.className = '_ripple-el'
      Object.assign(ripple.style, {
        width: size + 'px',
        height: size + 'px',
        left: (x - size / 2) + 'px',
        top: (y - size / 2) + 'px',
        background: `rgba(${lightColor}, 0.4)`,
      })
      target.appendChild(ripple)

      // Halo class
      target.classList.add('_tapping')

      // Clean up
      setTimeout(() => {
        ripple.remove()
        target.classList.remove('_tapping')
        target.style.overflow = prevOverflow
      }, 500)
    }

    document.addEventListener('touchstart', onTap, { passive: true })
    document.addEventListener('mousedown', onTap)
    return () => {
      document.removeEventListener('touchstart', onTap)
      document.removeEventListener('mousedown', onTap)
      style.remove()
    }
  }, [])

  return null
}
