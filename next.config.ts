import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ntplehmhhruzflvitool.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50cGxlaG1oaHJ1emZsdml0b29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzg2MzcsImV4cCI6MjA5NTYxNDYzN30.uOC4K1ybGP210BiFMQJkITGVjLS8YuoLVIPTULGFAwA',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'https://smelabuan.justintanjw06.workers.dev',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ntplehmhhruzflvitool.supabase.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
}

export default nextConfig
