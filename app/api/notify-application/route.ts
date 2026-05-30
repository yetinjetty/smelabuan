import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { full_name, email, business_name, membership_type, business_size } = body

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return Response.json({ error: 'Resend not configured' }, { status: 500 })

  const adminEmail = process.env.ADMIN_EMAIL ?? 'justintanjw06@gmail.com'

  const feeMap: Record<string, Record<string, string>> = {
    Life:     { Micro: 'RM 500 + RM 50 entry fee', Small: 'RM 1,000 + RM 50 entry fee', Medium: 'RM 2,000 + RM 50 entry fee' },
    Ordinary: { Micro: 'RM 50/year + RM 50 entry fee', Small: 'RM 100/year + RM 50 entry fee', Medium: 'RM 200/year + RM 50 entry fee' },
  }
  const fee = feeMap[membership_type]?.[business_size] ?? 'To be confirmed'

  // 1. Confirmation email to applicant
  const applicantEmail = {
    from: 'SME Association Labuan <noreply@smelabuan.pages.dev>',
    to: [email],
    subject: 'We received your membership application — SME Association Labuan',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background:#E05A4E;padding:32px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">SME Association Labuan</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Membership Application</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">Application Received ✓</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              Dear <strong>${full_name}</strong>,<br/><br/>
              Thank you for applying to join the SME Association of Labuan. We have received your application and our secretariat will review it shortly.
            </p>
            <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Application Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr><td style="color:#6b7280;padding:4px 0;">Name</td><td style="color:#111827;font-weight:500;text-align:right;">${full_name}</td></tr>
                <tr><td style="color:#6b7280;padding:4px 0;">Business</td><td style="color:#111827;font-weight:500;text-align:right;">${business_name}</td></tr>
                <tr><td style="color:#6b7280;padding:4px 0;">Membership</td><td style="color:#111827;font-weight:500;text-align:right;">${membership_type} — ${business_size}</td></tr>
                <tr><td style="color:#6b7280;padding:4px 0;">Fees due</td><td style="color:#E05A4E;font-weight:600;text-align:right;">${fee}</td></tr>
              </table>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.6;"><strong>What happens next?</strong></p>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
              Our secretariat will review your application within 3–5 working days. Once approved, you will receive payment instructions via email. Membership is activated upon receipt of payment.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">SME Association Labuan &nbsp;·&nbsp; Labuan, Malaysia<br/>
            <a href="https://smelabuan.pages.dev" style="color:#E05A4E;text-decoration:none;">smelabuan.pages.dev</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }

  // 2. Notification email to admin
  const adminNotif = {
    from: 'SME Association Labuan <noreply@smelabuan.pages.dev>',
    to: [adminEmail],
    subject: `New membership application — ${full_name}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background:#E05A4E;padding:32px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">New Application Received</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">SME Association Labuan — Admin Notification</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              A new membership application has been submitted and is awaiting your review.
            </p>
            <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Applicant Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr><td style="color:#6b7280;padding:4px 0;">Name</td><td style="color:#111827;font-weight:500;text-align:right;">${full_name}</td></tr>
                <tr><td style="color:#6b7280;padding:4px 0;">Email</td><td style="color:#111827;font-weight:500;text-align:right;">${email}</td></tr>
                <tr><td style="color:#6b7280;padding:4px 0;">Business</td><td style="color:#111827;font-weight:500;text-align:right;">${business_name}</td></tr>
                <tr><td style="color:#6b7280;padding:4px 0;">Membership</td><td style="color:#111827;font-weight:500;text-align:right;">${membership_type} — ${business_size}</td></tr>
                <tr><td style="color:#6b7280;padding:4px 0;">Fees</td><td style="color:#E05A4E;font-weight:600;text-align:right;">${fee}</td></tr>
              </table>
            </div>
            <a href="https://smelabuan.pages.dev/admin/members?status=pending"
               style="display:block;background:#E05A4E;color:#ffffff;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">
              Review Application →
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">SME Association Labuan Admin Panel</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }

  // Send both emails
  const [r1, r2] = await Promise.all([
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(applicantEmail),
    }),
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(adminNotif),
    }),
  ])

  if (!r1.ok || !r2.ok) {
    return Response.json({ error: 'Failed to send one or more emails' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
