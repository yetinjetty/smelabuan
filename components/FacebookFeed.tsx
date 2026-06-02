'use client'

import Script from 'next/script'
import { useEffect } from 'react'

export default function FacebookFeed() {
  // Re-parse XFBML on mount so the embed works after client-side navigation
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).FB) (window as any).FB.XFBML.parse()
  }, [])

  return (
    <>
      <Script
        id="facebook-jssdk"
        src="https://connect.facebook.net/ms_MY/sdk.js#xfbml=1&version=v21.0"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onLoad={() => (window as any).FB?.XFBML.parse()}
      />
      <div id="fb-root" />
      <div
        className="fb-page"
        data-href="https://www.facebook.com/smelabuan"
        data-tabs="timeline"
        data-width="500"
        data-height="600"
        data-small-header="true"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="false"
      />
    </>
  )
}
