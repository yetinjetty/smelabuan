import { createServiceClient } from '@/lib/supabase/server'
import AnnouncementsAdmin from './AnnouncementsAdmin'
import type { Announcement } from '@/lib/types'

export default async function AnnouncementsPage() {
  const service = createServiceClient()
  const { data: announcements } = await service
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Announcement[]>()

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#111827' }}>
      <AnnouncementsAdmin announcements={announcements ?? []} />
    </div>
  )
}
