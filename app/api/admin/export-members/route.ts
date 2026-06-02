import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Member } from '@/lib/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: adminUser } = await supabase
    .from('admin_users').select('id').eq('auth_user_id', user.id).single()
  if (!adminUser) return new Response('Forbidden', { status: 403 })

  const service = createServiceClient()
  const { data: members } = await service
    .from('members')
    .select('*')
    .order('full_name', { ascending: true })
    .returns<Member[]>()

  const HEADERS = [
    'Member ID', 'Full Name', 'Email', 'Phone', 'IC Number',
    'Business Name', 'SSM Reg No', 'Business Sector', 'Sector Category',
    'Business Size', 'Business Address',
    'Membership Type', 'Status', 'Member Since', 'Expiry Date', 'Payment Ref',
    'Rep Name', 'Rep IC', 'Rep Phone',
    'Created At',
  ]

  const KEYS: (keyof Member)[] = [
    'member_id', 'full_name', 'email', 'phone', 'ic_number',
    'business_name', 'ssm_reg_no', 'business_sector', 'sector_category',
    'business_size', 'business_address',
    'membership_type', 'status', 'member_since', 'expiry_date', 'payment_ref',
    'rep_name', 'rep_ic', 'rep_phone',
    'created_at',
  ]

  function esc(v: unknown): string {
    const s = v == null ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }

  const rows = [
    HEADERS.map(h => esc(h)).join(','),
    ...(members ?? []).map(m => KEYS.map(k => esc(m[k])).join(',')),
  ].join('\n')

  return new Response(rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="SME member list.csv"',
    },
  })
}
