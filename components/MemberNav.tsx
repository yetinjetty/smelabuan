'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const leftLinks = [
  { href: '/home', label: 'Home', icon: HomeIcon },
  { href: '/directory', label: 'Directory', icon: UsersIcon },
]

const rightLinks = [
  { href: '/deals', label: 'Deals', icon: TagIcon },
  { href: '/events', label: 'Events', icon: CalendarIcon },
]


export default function MemberNav() {
  const pathname = usePathname()
  const isCard = pathname === '/card'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-inset-bottom"
      style={{ height: 64, overflow: 'visible' }}
    >
      {/* Tab row — centre slot is a plain spacer so tabs don't crowd the button */}
      <div className="flex h-full overflow-visible">

        {/* Left tabs */}
        {leftLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="group flex-1 flex flex-col items-center justify-center gap-0.5"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors group-active:bg-[rgba(224,90,78,0.10)]">
                <Icon
                  className="w-[22px] h-[22px] transition-colors duration-200"
                  style={{ color: active ? '#E05A4E' : '#9CA3AF' }}
                />
              </div>
              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: active ? '#E05A4E' : '#9CA3AF' }}
              >
                {label}
              </span>
              {/* Active pip */}
              <div
                className="w-1 h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: '#E05A4E',
                  opacity: active ? 1 : 0,
                  transform: active ? 'scale(1)' : 'scale(0)',
                }}
              />
            </Link>
          )
        })}

        {/* Centre spacer — keeps side tabs evenly spread */}
        <div className="flex-1" />

        {/* Right tabs */}
        {rightLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="group flex-1 flex flex-col items-center justify-center gap-0.5"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors group-active:bg-[rgba(224,90,78,0.10)]">
                <Icon
                  className="w-[22px] h-[22px] transition-colors duration-200"
                  style={{ color: active ? '#E05A4E' : '#9CA3AF' }}
                />
              </div>
              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: active ? '#E05A4E' : '#9CA3AF' }}
              >
                {label}
              </span>
              <div
                className="w-1 h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: '#E05A4E',
                  opacity: active ? 1 : 0,
                  transform: active ? 'scale(1)' : 'scale(0)',
                }}
              />
            </Link>
          )
        })}

      </div>

      {/* Centre — anchored to nav directly so shadow overflows freely */}
      <Link
        href="/card"
        className="absolute left-1/2 -translate-x-1/2 active:scale-90 transition-transform duration-150"
        style={{ bottom: 18, WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            boxShadow: isCard
              ? '0 0 0 4px rgba(224,90,78,0.20), 0 -8px 32px rgba(224,90,78,0.18), 0 8px 24px rgba(0,0,0,0.10)'
              : '0 -8px 32px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.10)',
            border: isCard ? '3px solid #E05A4E' : '2.5px solid #e8e8e8',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
          }}
        >
          <Image
            src="/SMEA Labuan Logo v1.png"
            alt="SMELA Labuan"
            width={44}
            height={34}
            className="object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>
      </Link>

    </nav>
  )
}

function HomeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 9-9 9 9M4.5 10.5V19.5a.75.75 0 0 0 .75.75H9.75v-4.5h4.5v4.5h4.5a.75.75 0 0 0 .75-.75V10.5" />
    </svg>
  )
}

function UsersIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function TagIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  )
}

function CalendarIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}
