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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const service = createServiceClient()
    const { error } = await service.storage
      .from('ad-images')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const { data: { publicUrl } } = service.storage.from('ad-images').getPublicUrl(path)
    return Response.json({ url: publicUrl })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
