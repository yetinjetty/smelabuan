import { NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

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

    const { memberId, membershipType } = await request.json()
    if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 })

    const service = createServiceClient()

    // Get member details before updating
    const { data: memberData } = await service
      .from('members')
      .select('full_name, email, business_name')
      .eq('id', memberId)
      .single()

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

    // Send approval email
    let emailSent = false
    let emailError: string | null = null

    if (!memberData?.email) {
      emailError = 'Member email address not found in database'
    } else {
      const expiryText = expiryDate
        ? `Valid until <strong>${new Date(expiryDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>`
        : 'Lifetime membership — no expiry'

      const result = await sendEmail({
        to: memberData.email,
        subject: 'Membership Approved — SME Association Labuan',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
              <tr><td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
                  <tr><td align="center" style="padding-bottom:24px">
                    <div style="display:inline-block;width:56px;height:56px;background:#E05A4E;border-radius:14px;text-align:center;line-height:56px;font-size:22px;font-weight:700;color:#fff">S</div>
                    <p style="margin:8px 0 0;font-size:15px;font-weight:600;color:#111827">SME Association Labuan</p>
                  </td></tr>
                  <tr><td style="background:#fff;border-radius:16px;padding:32px 28px;border:1px solid #e5e7eb">
                    <div style="text-align:center;margin-bottom:24px">
                      <div style="width:56px;height:56px;background:#dcfce7;border-radius:50%;margin:0 auto 12px;line-height:56px;font-size:28px">✓</div>
                      <h1 style="margin:0;font-size:20px;font-weight:700;color:#111827">Membership Approved!</h1>
                      <p style="margin:8px 0 0;font-size:14px;color:#6b7280">Welcome to the SME Association Labuan</p>
                    </div>
                    <p style="font-size:14px;color:#374151">Dear <strong>${memberData.full_name}</strong>,</p>
                    <p style="font-size:14px;color:#374151">Your membership application has been approved. You now have full access to the member portal.</p>
                    <div style="background:#fef2f2;border:2px solid #E05A4E;border-radius:12px;padding:20px;margin:24px 0;text-align:center">
                      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#E05A4E;letter-spacing:0.08em;text-transform:uppercase">Your Member ID</p>
                      <p style="margin:0;font-size:28px;font-weight:700;color:#111827;letter-spacing:0.15em;font-family:monospace">${newMemberId}</p>
                      <p style="margin:8px 0 0;font-size:12px;color:#6b7280">${membershipType} Membership &nbsp;·&nbsp; ${expiryText}</p>
                    </div>
                    <p style="font-size:14px;color:#374151">Log in to access your digital membership card, member directory, events, and exclusive deals.</p>
                    <div style="text-align:center;margin-top:24px">
                      <a href="https://tanjw06.workers.dev/login" style="display:inline-block;background:#E05A4E;color:#fff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600">
                        Access Member Portal
                      </a>
                    </div>
                  </td></tr>
                  <tr><td align="center" style="padding-top:20px">
                    <p style="margin:0;font-size:11px;color:#9ca3af">© 2025 SME Association Labuan &nbsp;·&nbsp; Labuan, Malaysia</p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      })

      emailSent = result.sent
      emailError = result.error ?? null
    }

    return Response.json({ ok: true, member_id: newMemberId, emailSent, emailError })
  } catch (err) {
    console.error('approve error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
