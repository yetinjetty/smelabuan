'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Called on every member page load.
// Signs the user out if their "remember me" preference has expired
// or if the browser was closed without the persistent option.
export default function SessionGuard() {
  const router = useRouter()

  useEffect(() => {
    const rememberUntil = localStorage.getItem('sme_remember_until')
    const sessionActive = sessionStorage.getItem('sme_session')

    const isPersistentValid = rememberUntil && Date.now() < parseInt(rememberUntil, 10)
    const isSessionValid   = !!sessionActive

    if (!isPersistentValid && !isSessionValid) {
      // No valid remember flag — sign out silently
      const supabase = createClient()
      supabase.auth.signOut().then(() => {
        router.replace('/login')
      })
    }
  }, [router])

  return null
}
