import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const EDITABLE_FIELDS = [
  'full_name', 'email', 'phone', 'ic_number',
  'member_id', 'membership_type', 'status', 'member_since', 'expiry_date', 'payment_ref',
  'business_name', 'ssm_reg_no', 'business_sector', 'business_size', 'business_address', 'sector_category',
  'rep_name', 'rep_ic', 'rep_phone',
] as const

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

    const { memberId, ...fields } = await request.json()
    if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 })

    const update: Record<string, unknown> = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in fields) {
        const v = fields[key]
        update[key] = (v === '' || v === undefined) ? null : v
      }
    }

    if (Object.keys(update).length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 })

    const service = createServiceClient()
    const { error } = await service.from('members').update(update).eq('id', memberId)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    await service.from('activity_log').insert({
      member_id: memberId,
      admin_id: adminUser.id,
      action: 'edited',
      details: `Edited: ${Object.keys(update).join(', ')}`,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('edit-member error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
