import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Member, Advertisement, Event, Announcement } from '@/lib/types'
import AdCarousel from '@/components/AdCarousel'
import MemberHeroCard from '@/components/MemberHeroCard'
import HomeWidgets from '@/components/HomeWidgets'
import FacebookPosts from '@/components/FacebookPosts'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: member },
    { data: ads },
    { data: events },
    { data: announcements },
    { count: memberCount },
  ] = await Promise.all([
    service.from('members').select('*').eq('email', user.email!).single<Member>(),
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
      .eq('listed', true)
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
    service
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const liveAnnouncements = (announcements ?? []).filter(a =>
    a.status === 'published' ||
    (a.status === 'scheduled' && a.scheduled_for != null && new Date(a.scheduled_for) <= new Date())
  )

  return (
    <div className="pb-6 space-y-6">
      {/* Hero card */}
      {member && (
        <MemberHeroCard
          fullName={member.full_name}
          memberId={member.member_id}
          membershipType={member.membership_type ?? 'Ordinary'}
          status={member.status}
        />
      )}

      <div className="px-4 space-y-6 relative" style={{ zIndex: 0 }}>

        {/* Member count + Notifications widgets */}
        <HomeWidgets
          memberCount={memberCount ?? 0}
          announcements={liveAnnouncements}
        />

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

        {/* Facebook feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Facebook</h2>
            <a
              href="https://www.facebook.com/smelabuan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium"
              style={{ color: '#E05A4E' }}
            >
              View page
            </a>
          </div>
          <FacebookPosts />
        </div>

      </div>
    </div>
  )
}
