import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Auth client — reads/writes session cookies
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ntplehmhhruzflvitool.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}

// Service role client — bypasses RLS entirely, no cookies needed
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ntplehmhhruzflvitool.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!key) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — service client will fail')
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
