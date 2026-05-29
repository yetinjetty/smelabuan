import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!adminUser) return new Response('Forbidden', { status: 403 })

  const format = request.nextUrl.searchParams.get('format') ?? 'csv'

  const { data: logs } = await supabase
    .from('activity_log')
    .select('*, members(full_name, member_id), admin_users(full_name)')
    .order('created_at', { ascending: false })

  const rows = (logs ?? []).map((log: any) => ({
    date: log.created_at,
    action: log.action,
    member_name: log.members?.full_name ?? '',
    member_id: log.members?.member_id ?? '',
    admin: log.admin_users?.full_name ?? '',
    details: log.details ?? '',
    payment_ref: log.payment_ref ?? '',
  }))

  if (format === 'csv') {
    const headers = ['date', 'action', 'member_name', 'member_id', 'admin', 'details', 'payment_ref']
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(',')
      ),
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="activity-log-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  // Excel: TSV wrapped in a response that Excel will open
  const headers = ['Date', 'Action', 'Member Name', 'Member ID', 'Admin', 'Details', 'Payment Ref']
  const keys = ['date', 'action', 'member_name', 'member_id', 'admin', 'details', 'payment_ref']
  const tsv = [
    headers.join('\t'),
    ...rows.map(r => keys.map(k => (r as any)[k] ?? '').join('\t')),
  ].join('\n')

  return new Response(tsv, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="activity-log-${new Date().toISOString().split('T')[0]}.xls"`,
    },
  })
}
