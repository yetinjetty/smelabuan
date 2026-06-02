import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ZoomPrevention from '@/components/ZoomPrevention'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SME Association Labuan',
  description: 'Member management portal for SME Association of Labuan',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#E05A4E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 text-gray-900`}>
        <ZoomPrevention />
        {children}
      </body>
    </html>
  )
}
