'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/renewals', label: 'Renewals' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/ads', label: 'Advertisements' },
  { href: '/admin/log', label: 'Activity Log' },
  { href: '/admin/settings', label: 'Settings' },
]

export default function AdminSidebar({ adminName, role }: { adminName: string; role: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-200 shrink-0">
      <div className="px-6 py-5 border-b border-gray-200">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-3"
          style={{ backgroundColor: '#E05A4E' }}
        >
          S
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{adminName}</p>
        <p className="text-xs text-gray-500 capitalize">{role}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#E05A4E] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <Link
          href="/card"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <span>📱</span> App View
        </Link>
        <button
          onClick={signOut}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
