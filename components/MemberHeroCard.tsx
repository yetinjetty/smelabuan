'use client'

import { useMemo } from 'react'
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

  const statusColor =
    status === 'active' ? 'bg-green-400/20 text-green-100' :
    status === 'expired' ? 'bg-red-300/20 text-red-100' :
    'bg-yellow-400/20 text-yellow-100'

  return (
    <a
      href="/card"
      className="block rounded-2xl p-5 text-white relative overflow-hidden active:opacity-90 transition-opacity"
      style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10" />

      <div className="relative z-10">
        {/* Greeting */}
        <p className="text-white/70 text-sm">{greet},</p>
        <h1 className="text-2xl font-bold text-white leading-tight">{fullName}</h1>

        {/* Member ID + status */}
        <div className="flex items-center gap-2 mt-1 mb-4">
          {memberId && <span className="text-white/60 text-xs font-mono">{memberId}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor}`}>
            {status}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-4">
          <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Membership</p>
          <p className="font-semibold text-lg">{membershipType} Member</p>
          {businessName && <p className="text-sm text-white/80 mt-0.5">{businessName}</p>}
          <p className="text-xs text-white/50 mt-3">
            {expiryDate
              ? `Expires ${format(new Date(expiryDate), 'd MMM yyyy')}`
              : 'Lifetime membership'}
          </p>
        </div>
      </div>
    </a>
  )
}
