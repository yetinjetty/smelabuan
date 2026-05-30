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

    const { memberId } = await request.json()
    if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 })

    const service = await createServiceClient()

    // Get the member's auth_user_id before deleting
    const { data: member } = await service
      .from('members')
      .select('auth_user_id, full_name')
      .eq('id', memberId)
      .single()

    // Log before deleting
    await service.from('activity_log').insert({
      member_id: memberId,
      admin_id: adminUser.id,
      action: 'edited',
      details: `Member record deleted by admin${member?.full_name ? `: ${member.full_name}` : ''}`,
    })

    // Delete the member row
    const { error } = await service.from('members').delete().eq('id', memberId)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Also delete the Supabase auth user if one exists
    if (member?.auth_user_id) {
      const { error: authError } = await service.auth.admin.deleteUser(member.auth_user_id)
      if (authError) {
        // Non-fatal — member row is already deleted, log the warning
        console.warn('Could not delete auth user:', authError.message)
      }
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('delete-member error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
