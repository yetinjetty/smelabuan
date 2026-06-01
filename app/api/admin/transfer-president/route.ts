import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerAdmin } = await supabase
      .from('admin_users')
      .select('id, role, full_name, email')
      .eq('auth_user_id', user.id)
      .single()
    if (!callerAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })
    if (callerAdmin.role !== 'president') {
      return Response.json({ error: 'Only the president can transfer this role.' }, { status: 403 })
    }

    const { targetType, targetId, selfRole } = await request.json()
    if (!targetType || !targetId || !selfRole) {
      return Response.json({ error: 'targetType, targetId and selfRole are required.' }, { status: 400 })
    }
    if (!['member', 'admin'].includes(targetType)) {
      return Response.json({ error: 'Invalid targetType.' }, { status: 400 })
    }
    if (!['editor', 'member'].includes(selfRole)) {
      return Response.json({ error: 'Invalid selfRole.' }, { status: 400 })
    }

    const service = createServiceClient()

    let newPresidentName = ''
    let newPresidentEmail = ''

    if (targetType === 'admin') {
      // Target is an existing editor — just promote them
      const { data: targetAdmin, error: fetchErr } = await service
        .from('admin_users')
        .select('id, full_name, email, role')
        .eq('id', targetId)
        .single()
      if (fetchErr || !targetAdmin) return Response.json({ error: 'Target admin not found.' }, { status: 404 })
      if (targetAdmin.role === 'president') {
        return Response.json({ error: 'That person is already the president.' }, { status: 400 })
      }
      const { error: promoteErr } = await service
        .from('admin_users')
        .update({ role: 'president' })
        .eq('id', targetId)
      if (promoteErr) return Response.json({ error: promoteErr.message }, { status: 500 })
      newPresidentName = targetAdmin.full_name
      newPresidentEmail = targetAdmin.email
    } else {
      // Target is a regular member — create their admin record
      const { data: targetMember, error: fetchErr } = await service
        .from('members')
        .select('id, full_name, email')
        .eq('id', targetId)
        .single()
      if (fetchErr || !targetMember) return Response.json({ error: 'Target member not found.' }, { status: 404 })

      // Guard: member must not already be an admin
      const { data: existingAdmin } = await service
        .from('admin_users')
        .select('id')
        .eq('email', targetMember.email.toLowerCase())
        .maybeSingle()
      if (existingAdmin) {
        return Response.json({ error: 'That member is already an admin. Select them from the admin list instead.' }, { status: 409 })
      }

      const { error: insertErr } = await service.from('admin_users').insert({
        full_name: targetMember.full_name,
        email: targetMember.email.toLowerCase().trim(),
        role: 'president',
      })
      if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })
      newPresidentName = targetMember.full_name
      newPresidentEmail = targetMember.email
    }

    // Handle caller's own demotion
    if (selfRole === 'editor') {
      const { error: demoteErr } = await service
        .from('admin_users')
        .update({ role: 'editor' })
        .eq('id', callerAdmin.id)
      if (demoteErr) return Response.json({ error: demoteErr.message }, { status: 500 })
    } else {
      // Remove from admin_users entirely — they stay as a regular member
      const { error: deleteErr } = await service
        .from('admin_users')
        .delete()
        .eq('id', callerAdmin.id)
      if (deleteErr) return Response.json({ error: deleteErr.message }, { status: 500 })
    }

    await service.from('activity_log').insert({
      admin_id: callerAdmin.id,
      action: 'edited',
      details: `President role transferred from ${callerAdmin.full_name} to ${newPresidentName} (${newPresidentEmail}). ${callerAdmin.full_name} is now ${selfRole === 'editor' ? 'an editor' : 'a regular member'}.`,
    })

    return Response.json({ ok: true, newPresidentName })
  } catch (err) {
    console.error('transfer-president error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
