import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Member } from '@/lib/types'
import SignOutButton from './SignOutButton'

export default async function CardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)
    .single<Member>()

  if (!member || member.status === 'pending') {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <p className="text-gray-500 text-center">
          Your membership card will be available once your application is approved.
        </p>
        <SignOutButton />
      </div>
    )
  }

  const qrData = `SMEL:${member.member_id}:${member.full_name}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`

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

      {/* QR Code */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-3 w-full max-w-sm">
        <p className="text-sm font-medium text-gray-700">Scan to verify</p>
        <img src={qrUrl} alt="Member QR code" className="w-48 h-48" />
        <p className="text-xs text-gray-400 font-mono">{member.member_id}</p>
      </div>

      <SignOutButton />
    </div>
  )
}
