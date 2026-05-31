import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify caller is an admin
    const { data: callerAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    if (!callerAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { adminId } = await request.json()
    if (!adminId) return Response.json({ error: 'adminId required' }, { status: 400 })

    // Prevent self-demotion
    if (adminId === callerAdmin.id) {
      return Response.json({ error: 'You cannot demote yourself.' }, { status: 400 })
    }

    const service = createServiceClient()

    // Get the admin record before deleting
    const { data: targetAdmin } = await service
      .from('admin_users')
      .select('email, full_name, auth_user_id')
      .eq('id', adminId)
      .single()

    if (!targetAdmin) return Response.json({ error: 'Admin not found' }, { status: 404 })

    // Check if they already have a member record
    const { data: existingMember } = await service
      .from('members')
      .select('id, status')
      .eq('email', targetAdmin.email)
      .maybeSingle()

    // Remove from admin_users
    const { error: deleteError } = await service
      .from('admin_users')
      .delete()
      .eq('id', adminId)

    if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 })

    // Log the action
    await service.from('activity_log').insert({
      admin_id: callerAdmin.id,
      action: 'edited',
      details: `Admin ${targetAdmin.full_name} (${targetAdmin.email}) demoted to member`,
    })

    return Response.json({
      ok: true,
      hadMemberRecord: !!existingMember,
      memberStatus: existingMember?.status ?? null,
    })
  } catch (err) {
    console.error('demote-admin error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
