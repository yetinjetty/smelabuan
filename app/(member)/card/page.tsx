import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Member } from '@/lib/types'
import SignOutButton from './SignOutButton'

export default async function CardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const [{ data: member }, { data: adminUser }] = await Promise.all([
    service.from('members').select('*').eq('email', user.email!).single<Member>(),
    service.from('admin_users').select('id').eq('auth_user_id', user.id).single(),
  ])

  const isAdmin = !!adminUser

  if (!member || member.status === 'pending') {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500 text-center">
          Your membership card will be available once your application is approved.
        </p>
        {isAdmin && (
          <a
            href="/admin"
            className="w-full max-w-sm py-3 rounded-2xl text-center text-sm font-medium text-white"
            style={{ backgroundColor: '#E05A4E' }}
          >
            ⚙ Switch to Admin Panel
          </a>
        )}
        <SignOutButton />
      </div>
    )
  }

  const isLife = member.membership_type === 'Life'
  const memberSinceYear = member.member_since
    ? new Date(member.member_since).getFullYear()
    : (member.created_at ? new Date(member.created_at).getFullYear() : null)

  const infoRows = [
    {
      icon: <IdCardIcon />,
      label: 'Member ID',
      value: member.member_id ?? '—',
      mono: true,
      accent: false,
    },
    {
      icon: <BadgeIcon />,
      label: 'Membership type',
      value: isLife ? 'Life Member' : 'Ordinary Member',
      mono: false,
      accent: true,
    },
    {
      icon: <CalendarIcon />,
      label: 'Member since',
      value: memberSinceYear ? String(memberSinceYear) : '—',
      mono: false,
      accent: false,
    },
    {
      icon: <FeeIcon />,
      label: 'Annual fee',
      value: isLife ? 'N/A (Lifetime)' : 'Annual renewal',
      mono: false,
      accent: false,
    },
    {
      icon: <ClockIcon />,
      label: 'Renewal due',
      value: isLife
        ? '—'
        : member.expiry_date
          ? format(new Date(member.expiry_date), 'd MMM yyyy')
          : '—',
      mono: false,
      accent: false,
    },
  ]

  return (
    <div className="px-4 py-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 self-start">My Card</h1>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
      >
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-widest">SME Association</p>
            <p className="text-sm font-medium text-white/80">Labuan</p>
          </div>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
            {member.membership_type}
          </span>
        </div>

        <div className="mb-6">
          <p className="text-2xl font-bold">{member.full_name}</p>
          {member.business_name && (
            <p className="text-sm text-white/70 mt-1">{member.business_name}</p>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide">Member ID</p>
            <p className="text-lg font-mono font-bold tracking-wider">{member.member_id}</p>
            {member.expiry_date ? (
              <p className="text-xs text-white/60 mt-1">
                Exp {format(new Date(member.expiry_date), 'MMM yyyy')}
              </p>
            ) : (
              <p className="text-xs text-white/60 mt-1">Lifetime</p>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            member.status === 'active'
              ? 'bg-green-400/30 text-green-100'
              : 'bg-red-400/30 text-red-100'
          }`}>
            {member.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Member info rows */}
      <div className="w-full max-w-sm mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {infoRows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center gap-3 px-4 py-3.5 ${i < infoRows.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="w-7 h-7 flex items-center justify-center text-gray-400 flex-none">
              {row.icon}
            </div>
            <span className="flex-1 text-sm text-gray-500">{row.label}</span>
            <span
              className={`text-sm font-semibold ${row.accent ? 'text-[#E05A4E]' : 'text-gray-800'} ${row.mono ? 'font-mono tracking-wider' : ''}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {isAdmin && (
        <a
          href="/admin"
          className="w-full max-w-sm mt-4 py-3 rounded-2xl text-center text-sm font-medium text-white"
          style={{ backgroundColor: '#E05A4E' }}
        >
          ⚙ Switch to Admin Panel
        </a>
      )}

      <SignOutButton />
    </div>
  )
}

function IdCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <circle cx="8" cy="12" r="2"/>
      <path d="M14 9h4M14 12h4M14 15h2"/>
    </svg>
  )
}

function BadgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 4.8L20 8l-4 3.9.94 5.5L12 15l-4.94 2.4L9 11.9 5 8l5.6-1.2z"/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )
}

function FeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M2 10h20"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 3"/>
    </svg>
  )
}
