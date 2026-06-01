import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    if (!adminUser) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { memberId } = await request.json()
    if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 })

    const service = createServiceClient()

    const { data: member } = await service
      .from('members')
      .select('id, full_name, member_id, membership_type')
      .eq('id', memberId)
      .single()

    if (!member) return Response.json({ error: 'Member not found' }, { status: 404 })
    if (member.membership_type !== 'Ordinary') {
      return Response.json({ error: 'Member is already a Life member.' }, { status: 400 })
    }

    // Reuse the same sequence number, just change O → L
    const currentId = member.member_id ?? ''
    const seqPart = currentId.split('-')[2] ?? '000'
    const newMemberId = `SMEL-L-${seqPart}`

    const { error } = await service
      .from('members')
      .update({
        membership_type: 'Life',
        member_id: newMemberId,
        expiry_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)

    if (error) return Response.json({ error: error.message }, { status: 500 })

    await service.from('activity_log').insert({
      member_id: memberId,
      admin_id: adminUser.id,
      action: 'upgraded',
      details: `Upgraded from Ordinary (${member.member_id}) to Life member (${newMemberId})`,
    })

    return Response.json({ ok: true, newMemberId })
  } catch (err) {
    console.error('upgrade-member error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
