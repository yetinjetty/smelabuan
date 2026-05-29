import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Event } from '@/lib/types'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .returns<Event[]>()

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Events</h1>

      {events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-20">No upcoming events</p>
      )}
    </div>
  )
}
