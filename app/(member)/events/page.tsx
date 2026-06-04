import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Event } from '@/lib/types'
import FadeCard from '@/components/FadeCard'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('listed', true)
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .returns<Event[]>()

  return (
    <div>
      {/* Red header */}
      <div
        className="px-6 pt-8 pb-8"
        style={{ background: 'linear-gradient(160deg, #E05A4E 0%, #c0392b 100%)' }}
      >
        <h1 className="text-xl font-bold text-white">Events</h1>
      </div>

      {/* Content sheet */}
      <div className="bg-gray-50 px-6 pt-5 pb-28">
        {events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => (
              <FadeCard key={event.id}>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex">
                  <div
                    className="flex-none w-20 flex flex-col items-center justify-center text-white py-4"
                    style={{ backgroundColor: '#E05A4E' }}
                  >
                    <span className="text-3xl font-bold leading-none">
                      {new Date(event.event_date).getDate()}
                    </span>
                    <span className="text-xs uppercase mt-1">
                      {format(new Date(event.event_date), 'MMM yyyy')}
                    </span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900">{event.title}</p>
                      <span className={`flex-none text-xs px-2 py-0.5 rounded-full ${
                        event.access_type === 'members_only'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {event.access_type === 'members_only' ? 'Members only' : 'Open'}
                      </span>
                    </div>
                    {event.venue && (
                      <p className="text-sm text-gray-500 mt-1">{event.venue}</p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {event.registered_count} registered
                    </p>
                  </div>
                </div>
              </div>
              </FadeCard>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            {/* Animated icon */}
            <div className="relative mb-6">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center animate-bounce"
                style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)', boxShadow: '0 8px 32px rgba(224,90,78,0.3)' }}
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
                </svg>
              </div>
              {/* Decorative star */}
              <span className="absolute -top-1 -right-2 text-xl animate-spin" style={{ animationDuration: '4s' }}>⭐</span>
            </div>

            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Coming Soon!</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
              Exciting events are being planned for our members.
              Check back soon — you won't want to miss what's coming!
            </p>

            {/* Placeholder event types */}
            <div className="flex gap-2 flex-wrap justify-center">
              {['Networking', 'Workshop', 'AGM', 'Gala'].map(tag => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full border font-medium"
                  style={{ borderColor: '#E05A4E', color: '#E05A4E', backgroundColor: 'rgba(224,90,78,0.06)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
