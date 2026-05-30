import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return Response.json({ allowed: false, reason: 'Email required.' }, { status: 400 })
    }

    const normalised = email.toLowerCase().trim()
    const service = createServiceClient()

    // Check admin_users (case-insensitive)
    const { data: admin } = await service
      .from('admin_users')
      .select('id')
      .ilike('email', normalised)
      .maybeSingle()

    if (admin) return Response.json({ allowed: true, role: 'admin' })

    // Check members (case-insensitive)
    const { data: member } = await service
      .from('members')
      .select('id, status')
      .ilike('email', normalised)
      .maybeSingle()

    if (!member) {
      return Response.json({
        allowed: false,
        reason: 'This email is not registered. Please apply for membership first.',
      })
    }

    if (member.status === 'inactive') {
      return Response.json({
        allowed: false,
        reason: 'Your membership has been deactivated. Please contact the secretariat.',
      })
    }

    return Response.json({ allowed: true, role: 'member' })

  } catch (err) {
    console.error('check-email error:', err)
    // Fail closed — if the check cannot run, block the OTP
    return Response.json({
      allowed: false,
      reason: 'Unable to verify registration. Please try again.',
    }, { status: 500 })
  }
}
