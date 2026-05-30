import { createBrowserClient } from '@supabase/ssr'

// These are public values (not secrets) — safe to commit.
// Get them from: Supabase Dashboard → Settings → API
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ntplehmhhruzflvitool.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
