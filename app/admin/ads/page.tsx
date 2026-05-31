import { createClient } from '@/lib/supabase/server'
import AdsAdmin from './AdsAdmin'
import type { Advertisement } from '@/lib/types'

export default async function AdminAdsPage() {
  const supabase = await createClient()
  const { data: ads } = await supabase
    .from('advertisements')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Advertisement[]>()

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#111827' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>Advertisements</h1>
      <AdsAdmin ads={ads ?? []} />
    </div>
  )
}

