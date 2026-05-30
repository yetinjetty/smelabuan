import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

    const service = await createServiceClient()

    // Check admin_users
    const { data: admin } = await service
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (admin) return Response.json({ allowed: true, role: 'admin' })

    // Check members (only active or pending — not expired/inactive)
    const { data: member } = await service
      .from('members')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (member) {
      if (member.status === 'inactive') {
        return Response.json({ allowed: false, reason: 'Your membership has been deactivated. Please contact the secretariat.' })
      }
      return Response.json({ allowed: true, role: 'member' })
    }

    return Response.json({ allowed: false, reason: 'This email is not registered. Please apply for membership first.' })
  } catch (err) {
    console.error('check-email error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
