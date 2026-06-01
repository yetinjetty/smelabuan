import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Member, Advertisement, Event, Announcement } from '@/lib/types'
import AdCarousel from '@/components/AdCarousel'
import MemberHeroCard from '@/components/MemberHeroCard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const now = new Date().toISOString()
  const today = now.split('T')[0]

  const [{ data: member }, { data: ads }, { data: events }, { data: announcements }] = await Promise.all([
    service
      .from('members')
      .select('*')
      .eq('email', user.email!)
      .single<Member>(),
    service
      .from('advertisements')
      .select('*')
      .eq('status', 'active')
      .or(`period_start.is.null,period_start.lte.${today}`)
      .or(`period_end.is.null,period_end.gte.${today}`)
      .order('created_at', { ascending: false })
      .returns<Advertisement[]>(),
    service
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(5)
      .returns<Event[]>(),
    service
      .from('announcements')
      .select('*')
      .in('status', ['published', 'scheduled'])
      .order('created_at', { ascending: false })
      .returns<Announcement[]>(),
  ])

  const liveAnnouncements = (announcements ?? []).filter(a =>
    a.status === 'published' ||
    (a.status === 'scheduled' && a.scheduled_for != null && new Date(a.scheduled_for) <= new Date())
  ).slice(0, 5)

  const statusColor =
    member?.status === 'active'
      ? 'bg-green-100 text-green-700'
      : member?.status === 'expired'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700'

  return (
    <div className="pb-6 space-y-6">
      {/* Hero card — sticky collapsing, manages its own px */}
      {member && (
        <MemberHeroCard
          fullName={member.full_name}
          memberId={member.member_id}
          membershipType={member.membership_type ?? 'Ordinary'}
          status={member.status}
        />
      )}

      {/* Remaining content — lower stacking context so sticky card always wins */}
      <div className="px-4 space-y-6 relative" style={{ zIndex: 0 }}>

      {/* Announcements */}
      {liveAnnouncements.length > 0 && (
        <div className="space-y-2">
          {liveAnnouncements.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
              {/* Accent bar */}
              <div className="w-1 shrink-0" style={{ backgroundColor: '#E05A4E' }} />
              <div className="px-4 py-3 flex gap-3 items-start">
                <span className="text-lg leading-none mt-0.5">📢</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ads carousel */}
      {ads && ads.length > 0 && <AdCarousel ads={ads} />}

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
    </div>
  )
}
