'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'

type Props = {
  fullName: string
  memberId: string | null
  membershipType: string | null
  businessName: string | null
  expiryDate: string | null
  status: string
}

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Good night'
}

export default function MemberHeroCard({ fullName, memberId, membershipType, businessName, expiryDate, status }: Props) {
  const greet = useMemo(() => greeting(), [])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const statusColor =
    status === 'active' ? 'bg-green-400/20 text-green-100' :
    status === 'expired' ? 'bg-red-300/20 text-red-100' :
    'bg-yellow-400/20 text-yellow-100'

  return (
    /* Sticky wrapper — sits at top of viewport when scrolled */
    <div
      className="sticky z-20 px-4"
      style={{ top: 0 }}
    >
      {/* Hairline bg strip so content scrolling beneath doesn't bleed through gaps */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gray-50"
        style={{ top: collapsed ? -8 : -24, transition: 'top 0.35s ease' }}
      />

      <a
        href="/card"
        className="block relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)',
          borderRadius: collapsed ? '0 0 20px 20px' : 16,
          transition: 'border-radius 0.35s ease',
        }}
      >
        {/* Decorative circles — fade out when collapsed */}
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"
          style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s ease' }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none"
          style={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s ease' }}
        />

        <div
          className="relative z-10"
          style={{
            padding: collapsed ? '12px 20px' : '20px 20px 0 20px',
            transition: 'padding 0.35s ease',
          }}
        >
          {/* Top row — always visible, shrinks when collapsed */}
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-white/70 leading-none"
                style={{
                  fontSize: collapsed ? 11 : 14,
                  marginBottom: collapsed ? 2 : 4,
                  transition: 'font-size 0.3s ease, margin-bottom 0.3s ease',
                }}
              >
                {greet},
              </p>
              <h1
                className="font-bold text-white leading-tight"
                style={{
                  fontSize: collapsed ? 16 : 26,
                  transition: 'font-size 0.3s ease',
                }}
              >
                {fullName}
              </h1>
            </div>
            {/* Compact membership pill shown only when collapsed */}
            <div
              style={{
                opacity: collapsed ? 1 : 0,
                transform: collapsed ? 'translateX(0)' : 'translateX(12px)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
              }}
            >
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium whitespace-nowrap">
                {membershipType}
              </span>
            </div>
          </div>

          {/* Member ID + status — always visible, shrinks */}
          <div
            className="flex items-center gap-2"
            style={{
              marginTop: collapsed ? 2 : 6,
              marginBottom: collapsed ? 0 : 16,
              transition: 'margin 0.35s ease',
            }}
          >
            {memberId && (
              <span
                className="text-white/60 font-mono"
                style={{ fontSize: collapsed ? 10 : 13, transition: 'font-size 0.3s ease' }}
              >
                {memberId}
              </span>
            )}
            <span className={`rounded-full font-medium capitalize ${statusColor}`}
              style={{
                fontSize: collapsed ? 10 : 12,
                padding: collapsed ? '1px 8px' : '2px 10px',
                transition: 'font-size 0.3s ease, padding 0.3s ease',
              }}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Collapsible bottom section */}
        <div
          style={{
            maxHeight: collapsed ? 0 : 140,
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            transition: 'max-height 0.35s ease, opacity 0.25s ease',
          }}
        >
          <div
            className="mx-5 border-t border-white/20"
            style={{ paddingTop: 14, paddingBottom: 20 }}
          >
            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Membership</p>
            <p className="font-semibold text-lg text-white">{membershipType} Member</p>
            {businessName && <p className="text-sm text-white/80 mt-0.5">{businessName}</p>}
            <p className="text-xs text-white/50 mt-2">
              {expiryDate
                ? `Expires ${format(new Date(expiryDate), 'd MMM yyyy')}`
                : 'Lifetime membership'}
            </p>
          </div>
        </div>
      </a>
    </div>
  )
}
