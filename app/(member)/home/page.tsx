import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Member, Advertisement, Event } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: member }, { data: ads }, { data: events }] = await Promise.all([
    supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', user.id)
      .single<Member>(),
    supabase
      .from('advertisements')
      .select('*')
      .eq('status', 'active')
      .lte('period_start', new Date().toISOString().split('T')[0])
      .gte('period_end', new Date().toISOString().split('T')[0])
      .limit(3)
      .returns<Advertisement[]>(),
    supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(3)
      .returns<Event[]>(),
  ])

  const statusColor =
    member?.status === 'active'
      ? 'bg-green-100 text-green-700'
      : member?.status === 'expired'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700'

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-gray-500 text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold text-gray-900">{member?.full_name ?? 'Member'}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-500">{member?.member_id}</span>
          {member?.status && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Membership card summary */}
      {member && (
        <div
          className="rounded-2xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)' }}
        >
          <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Membership</p>
          <p className="font-semibold text-lg">{member.membership_type} Member</p>
          <p className="text-sm text-white/80 mt-1">{member.business_name}</p>
          {member.expiry_date && (
            <p className="text-xs text-white/60 mt-3">
              Expires {format(new Date(member.expiry_date), 'd MMM yyyy')}
            </p>
          )}
          {!member.expiry_date && (
            <p className="text-xs text-white/60 mt-3">Lifetime membership</p>
          )}
        </div>
      )}

      {/* Ads carousel */}
      {ads && ads.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Featured</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {ads.map(ad => (
              <div
                key={ad.id}
                className="flex-none w-72 rounded-2xl bg-white border border-gray-200 overflow-hidden snap-start"
              >
                {ad.image_url ? (
                  <img src={ad.image_url} alt={ad.headline} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">{ad.advertiser_name}</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium text-sm text-gray-900">{ad.headline}</p>
                  <p className="text-xs text-gray-500">{ad.advertiser_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {events && events.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Upcoming Events</h2>
            <a href="/events" className="text-xs" style={{ color: '#E05A4E' }}>See all</a>
          </div>
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4">
                <div
                  className="flex-none w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: '#E05A4E' }}
                >
                  <span className="text-lg leading-none">
                    {new Date(event.event_date).getDate()}
                  </span>
                  <span className="uppercase">
                    {format(new Date(event.event_date), 'MMM')}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{event.title}</p>
                  {event.venue && <p className="text-xs text-gray-500 truncate">{event.venue}</p>}
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                    event.access_type === 'members_only'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {event.access_type === 'members_only' ? 'Members only' : 'Open'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
