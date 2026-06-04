import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ALLOWED_TABLES = ['events', 'deals'] as const
type AllowedTable = typeof ALLOWED_TABLES[number]

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminUser } = await supabase
      .from('admin_users').select('id').eq('auth_user_id', user.id).single()
    if (!adminUser) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { table, id, listed } = await request.json() as { table: AllowedTable; id: string; listed: boolean }

    if (!ALLOWED_TABLES.includes(table)) {
      return Response.json({ error: 'Invalid table' }, { status: 400 })
    }

    const service = createServiceClient()
    const { error } = await service.from(table).update({ listed }).eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
