import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? ''
    let fields: Record<string, string> = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') fields[key] = value
      }
    } else {
      fields = await request.json()
    }

    const {
      full_name, email, phone,
      business_name, business_sector, business_size, membership_type,
      ic_number, ssm_reg_no, business_address, sector_category,
      rep_name, rep_ic, rep_phone,
    } = fields

    if (!full_name || !email || !membership_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: inserted, error } = await service
      .from('members')
      .insert({
        full_name,
        email,
        phone: phone ?? null,
        business_name: business_name ?? null,
        business_sector: business_sector ?? null,
        business_size: business_size ?? null,
        membership_type,
        status: 'pending',
        ic_number: ic_number ?? null,
        ssm_reg_no: ssm_reg_no ?? null,
        business_address: business_address ?? null,
        sector_category: sector_category ?? null,
        rep_name: rep_name ?? null,
        rep_ic: rep_ic ?? null,
        rep_phone: rep_phone ?? null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return Response.json({ error: 'This email is already registered.' }, { status: 409 })
      return Response.json({ error: error.message }, { status: 500 })
    }

    if (!inserted) {
      return Response.json({ error: 'Record was not saved. Please try again.' }, { status: 500 })
    }

    await sendEmail({
      to: email,
      subject: 'Application Received — SME Association Labuan',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#E05A4E">Application Received</h2>
          <p>Dear ${full_name},</p>
          <p>Thank you for applying to the SME Association Labuan. We have received your application and will review it shortly.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
            <tr><td style="padding:6px 0;color:#666">Name</td><td style="padding:6px 0;font-weight:600">${full_name}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Membership</td><td style="padding:6px 0;font-weight:600">${membership_type} Member</td></tr>
            <tr><td style="padding:6px 0;color:#666">Business</td><td style="padding:6px 0;font-weight:600">${business_name ?? '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Size</td><td style="padding:6px 0;font-weight:600">${business_size ?? '—'}</td></tr>
          </table>
          <p>You will be notified by email once your application has been reviewed.</p>
          <p style="color:#666;font-size:13px">SME Association Labuan</p>
        </div>
      `,
    })

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Membership Application — ${full_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#E05A4E">New Application</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#666">Name</td><td style="padding:6px 0">${full_name}</td></tr>
              <tr><td style="padding:6px 0;color:#666">IC</td><td style="padding:6px 0">${ic_number ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${email}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Phone</td><td style="padding:6px 0">${phone ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Business</td><td style="padding:6px 0">${business_name ?? '—'} (SSM: ${ssm_reg_no ?? '—'})</td></tr>
              <tr><td style="padding:6px 0;color:#666">Sector</td><td style="padding:6px 0">${sector_category ?? ''} — ${business_sector ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Size</td><td style="padding:6px 0">${business_size ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Address</td><td style="padding:6px 0">${business_address ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Membership</td><td style="padding:6px 0">${membership_type} Member</td></tr>
              ${rep_name ? `<tr><td style="padding:6px 0;color:#666">Representative</td><td style="padding:6px 0">${rep_name} (IC: ${rep_ic ?? '—'}, Tel: ${rep_phone ?? '—'})</td></tr>` : ''}
            </table>
            <p><a href="https://smelabuan.justintanjw06.workers.dev/admin/members" style="color:#E05A4E">Review in admin panel →</a></p>
          </div>
        `,
      })
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('apply error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
