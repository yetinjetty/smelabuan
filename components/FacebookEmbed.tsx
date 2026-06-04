'use client'

import Script from 'next/script'

// Set this in Cloudflare Pages env vars after creating a free SociableKit
// "Facebook Page Posts" widget: NEXT_PUBLIC_SOCIABLEKIT_FB_ID
const WIDGET_ID = process.env.NEXT_PUBLIC_SOCIABLEKIT_FB_ID

export default function FacebookEmbed() {
  // Fallback while no widget is configured: a simple branded link card
  if (!WIDGET_ID) {
    return (
      <a
        href="https://www.facebook.com/smelabuan"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:scale-[0.98] transition-transform duration-150"
      >
        <span
          className="flex-none w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#1877F2' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07z" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm">SME Labuan on Facebook</p>
          <p className="text-xs text-gray-500">Tap to see our latest posts</p>
        </div>
        <span className="ml-auto text-xs font-medium" style={{ color: '#E05A4E' }}>
          Open →
        </span>
      </a>
    )
  }

  return (
    <>
      <div className={`sk-ww-facebook-page-posts`} data-embed-id={WIDGET_ID} />
      <Script
        src="https://widgets.sociablekit.com/facebook-page-posts/widget.js"
        strategy="afterInteractive"
      />
    </>
  )
}
