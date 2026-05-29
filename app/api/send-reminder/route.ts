import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!adminUser) return new Response('Forbidden', { status: 403 })

  const body = await request.json()
  const { member_id, email, full_name, expiry_date } = body

  if (!email || !full_name) {
    return Response.json({ error: 'email and full_name required' }, { status: 400 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return Response.json({ error: 'Resend not configured' }, { status: 500 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `SME Association Labuan <noreply@smelabuan.pages.dev>`,
      to: [email],
      subject: 'Your SME Labuan membership is due for renewal',
      html: `
        <p>Dear ${full_name},</p>
        <p>Your SME Association Labuan membership ${expiry_date ? `expired on <strong>${expiry_date}</strong>` : 'is due for renewal'}.</p>
        <p>Please contact the secretariat to renew your membership via bank transfer.</p>
        <p>Thank you,<br/>SME Association Labuan Secretariat</p>
      `,
    }),
  })

  if (!res.ok) {
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }

  if (member_id) {
    await supabase.from('activity_log').insert({
      member_id,
      admin_id: adminUser.id,
      action: 'renewed',
      details: `Renewal reminder sent to ${email}`,
    })
  }

  return Response.json({ ok: true })
}
