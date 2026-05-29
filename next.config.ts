import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ntplehmhhruzflvitool.supabase.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
}

export default nextConfig
