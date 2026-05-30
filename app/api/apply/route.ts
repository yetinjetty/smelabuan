import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, email, phone, business_name, business_sector, business_size, membership_type } = body

    if (!full_name || !email || !membership_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: inserted, error } = await service
      .from('members')
      .insert({
        full_name,
        email,
        phone,
        business_name,
        business_sector,
        business_size,
        membership_type,
        status: 'pending',
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

    // Send notification emails
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      // Confirmation to applicant
      await transporter.sendMail({
        from: `"SME Association Labuan" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Application Received — SME Association Labuan',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#E05A4E">Application Received</h2>
            <p>Dear ${full_name},</p>
            <p>Thank you for applying to the SME Association Labuan. We have received your application and will review it shortly.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
              <tr><td style="padding:6px 0;color:#666">Name</td><td style="padding:6px 0;font-weight:600">${full_name}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Membership</td><td style="padding:6px 0;font-weight:600">${membership_type}</td></tr>
              <tr><td style="padding:6px 0;color:#666">Business</td><td style="padding:6px 0;font-weight:600">${business_name ?? '—'}</td></tr>
            </table>
            <p>You will be notified by email once your application has been reviewed.</p>
            <p style="color:#666;font-size:13px">SME Association Labuan</p>
          </div>
        `,
      })

      // Notification to admin
      if (process.env.ADMIN_EMAIL) {
        await transporter.sendMail({
          from: `"SME Association Labuan" <${process.env.GMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `New Membership Application — ${full_name}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
              <h2 style="color:#E05A4E">New Application</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:6px 0;color:#666">Name</td><td style="padding:6px 0">${full_name}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">${email}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Phone</td><td style="padding:6px 0">${phone ?? '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Business</td><td style="padding:6px 0">${business_name ?? '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Sector</td><td style="padding:6px 0">${business_sector ?? '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Size</td><td style="padding:6px 0">${business_size ?? '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Membership</td><td style="padding:6px 0">${membership_type}</td></tr>
              </table>
              <p><a href="https://smelabuan.pages.dev/admin/members" style="color:#E05A4E">Review in admin panel →</a></p>
            </div>
          `,
        })
      }
    } catch (emailErr) {
      // Email failure is non-fatal — application is already saved
      console.error('Email send failed:', emailErr)
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('apply error:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
