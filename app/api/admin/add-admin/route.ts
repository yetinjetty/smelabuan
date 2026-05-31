import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    if (!callerAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { full_name, email, role } = await request.json()
    if (!full_name || !email || !role) {
      return Response.json({ error: 'Name, email and role required' }, { status: 400 })
    }

    const service = createServiceClient()

    const { error } = await service.from('admin_users').insert({
      full_name,
      email: email.toLowerCase().trim(),
      role,
    })

    if (error) {
      if (error.code === '23505') return Response.json({ error: 'This email is already an admin.' }, { status: 409 })
      return Response.json({ error: error.message }, { status: 500 })
    }

    await service.from('activity_log').insert({
      admin_id: callerAdmin.id,
      action: 'edited',
      details: `New admin added: ${full_name} (${email}) as ${role}`,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('add-admin error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
