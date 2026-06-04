import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminUser } = await supabase
      .from('admin_users').select('id').eq('auth_user_id', user.id).single()
    if (!adminUser) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { path } = await request.json() as { path: string }
    if (!path) return Response.json({ error: 'No path provided' }, { status: 400 })

    const service = createServiceClient()
    const { error } = await service.storage.from('card-images').remove([path])
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
