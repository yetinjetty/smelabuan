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

    const { memberId, status } = await request.json()
    if (!memberId || !status) return Response.json({ error: 'memberId and status required' }, { status: 400 })

    const allowed = ['active', 'inactive', 'expired']
    if (!allowed.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 })

    const service = createServiceClient()

    const { error } = await service
      .from('members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', memberId)

    if (error) return Response.json({ error: error.message }, { status: 500 })

    await service.from('activity_log').insert({
      member_id: memberId,
      admin_id: adminUser.id,
      action: 'edited',
      details: `Status changed to ${status}`,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('set-status error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
