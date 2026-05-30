import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify caller is an authenticated admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!adminUser) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { memberId, membershipType } = body

    if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 })

    // Use service client to bypass RLS
    const service = await createServiceClient()

    // Generate member_id
    const prefix = `SMEL-${membershipType === 'Life' ? 'L' : 'O'}`
    const { data: existing } = await service
      .from('members')
      .select('member_id')
      .like('member_id', `${prefix}-%`)
      .order('member_id', { ascending: false })
      .limit(1)

    const lastNum = existing?.[0]?.member_id
      ? parseInt(existing[0].member_id.split('-')[2], 10)
      : 0
    const newMemberId = `${prefix}-${String(lastNum + 1).padStart(3, '0')}`

    const today = new Date().toISOString().split('T')[0]
    const expiryDate = membershipType === 'Ordinary'
      ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      : null

    const { error } = await service
      .from('members')
      .update({
        status: 'active',
        member_id: newMemberId,
        member_since: today,
        expiry_date: expiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)

    if (error) return Response.json({ error: error.message }, { status: 500 })

    await service.from('activity_log').insert({
      member_id: memberId,
      admin_id: adminUser.id,
      action: 'approved',
      details: `Approved as ${newMemberId}`,
    })

    return Response.json({ ok: true, member_id: newMemberId })
  } catch (err) {
    console.error('approve error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
