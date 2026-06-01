'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const sections = [
  {
    label: 'MAIN',
    links: [
      { href: '/admin', label: 'Dashboard', exact: true, icon: '▦' },
      { href: '/admin/members', label: 'Members', icon: '👤' },
      { href: '/admin/renewals', label: 'Renewals', icon: '🕐', badge: true },
    ],
  },
  {
    label: 'CONTENT',
    links: [
      { href: '/admin/events', label: 'Events', icon: '📅' },
      { href: '/admin/deals', label: 'Deals', icon: '🎁' },
      { href: '/admin/ads', label: 'Advertisements', icon: '📣' },
    ],
  },
  {
    label: 'SYSTEM',
    links: [
      { href: '/admin/log', label: 'Activity Log', icon: '📋' },
      { href: '/admin/settings', label: 'Settings', icon: '⚙' },
    ],
  },
]

export default function AdminSidebar({
  adminName, role, renewalsDue = 0,
}: {
  adminName: string
  role: string
  renewalsDue?: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    localStorage.removeItem('sme_remember_until')
    sessionStorage.removeItem('sme_session')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = adminName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside
      className="hidden lg:flex flex-col w-60 shrink-0"
      style={{ backgroundColor: '#C0392B' }}
    >
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/10">
        <Image
          src="/SMEA Labuan Logo v1.png"
          alt="SMELA Labuan"
          width={110}
          height={42}
          className="object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <p className="text-white/50 text-xs mt-2">Admin panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {sections.map(section => (
          <div key={section.label}>
            <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase px-3 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.links.map(({ href, label, exact, icon, badge }) => {
                const active = exact ? pathname === href : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{icon}</span>
                    <span className="flex-1">{label}</span>
                    {badge && renewalsDue > 0 && (
                      <span className="bg-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {renewalsDue}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        <Link
          href="/card"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <span>📱</span> App View
        </Link>
        <button
          onClick={signOut}
          className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <span>🚪</span> Sign out
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3 px-3 pt-3 mt-2 border-t border-white/10">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{adminName}</p>
            <p className="text-white/50 text-[10px] capitalize">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
