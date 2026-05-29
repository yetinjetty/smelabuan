import { createClient } from '@/lib/supabase/server'
import EventsAdmin from './EventsAdmin'
import type { Event } from '@/lib/types'

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
    .returns<Event[]>()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Events</h1>
      <EventsAdmin events={events ?? []} />
    </div>
  )
}
