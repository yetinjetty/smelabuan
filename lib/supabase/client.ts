import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // NEXT_PUBLIC_ vars are embedded at build time.
  // Fallback to empty string prevents build-time throws; actual values
  // must be set in Cloudflare Pages → Settings → Environment variables.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )
}
