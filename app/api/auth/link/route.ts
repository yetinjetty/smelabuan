import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Called after OTP verify to link auth_user_id in members + admin_users.
// Uses service role to bypass RLS — anon client updates are silently blocked.
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    await Promise.all([
      service.from('admin_users')
        .update({ auth_user_id: user.id })
        .eq('email', user.email)
        .is('auth_user_id', null),
      service.from('members')
        .update({ auth_user_id: user.id })
        .eq('email', user.email)
        .is('auth_user_id', null),
    ])

    return Response.json({ ok: true })
  } catch (err) {
    console.error('link error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
