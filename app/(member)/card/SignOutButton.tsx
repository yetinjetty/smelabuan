'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={signOut}
      className="w-full max-w-sm mt-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-red-500 hover:border-red-200 transition-colors"
    >
      Sign out
    </button>
  )
}
