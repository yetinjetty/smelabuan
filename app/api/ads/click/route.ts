import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Must be a logged-in member (prevents anonymous spam)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { adId } = await request.json()
  if (!adId) return Response.json({ error: 'adId required' }, { status: 400 })

  const service = createServiceClient()

  // Atomic-safe increment via Postgres expression
  const { error } = await service.rpc('increment_ad_click', { ad_id: adId })

  if (error) {
    // Fallback: read-then-write if RPC doesn't exist yet
    const { data: ad } = await service
      .from('advertisements')
      .select('click_count')
      .eq('id', adId)
      .single()

    if (!ad) return Response.json({ error: 'Ad not found' }, { status: 404 })

    await service
      .from('advertisements')
      .update({ click_count: ad.click_count + 1 })
      .eq('id', adId)
  }

  return Response.json({ ok: true })
}
