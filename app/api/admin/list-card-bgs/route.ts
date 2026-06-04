import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminUser } = await supabase
      .from('admin_users').select('id').eq('auth_user_id', user.id).single()
    if (!adminUser) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const service = createServiceClient()
    const { data: files, error } = await service.storage
      .from('card-images')
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) return Response.json({ backgrounds: [] })

    const backgrounds = (files ?? [])
      .filter(f => !f.name.startsWith('.'))
      .map(f => ({
        path: f.name,
        src: service.storage.from('card-images').getPublicUrl(f.name).data.publicUrl,
      }))

    return Response.json({ backgrounds })
  } catch {
    return Response.json({ backgrounds: [] })
  }
}
