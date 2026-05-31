import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: EmailOptions): Promise<{ sent: boolean; error?: string }> {
  const gmailUser = process.env.GMAIL_USER
  // Strip spaces — Google App Passwords are shown as "xxxx xxxx xxxx xxxx"
  const gmailPass = (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s/g, '')

  if (!gmailUser || !gmailPass) {
    return { sent: false, error: 'GMAIL_USER or GMAIL_APP_PASSWORD not set in environment variables' }
  }

  // Try port 587 (STARTTLS) first, then 465 (SSL)
  const configs = [
    { host: 'smtp.gmail.com', port: 587, secure: false },
    { host: 'smtp.gmail.com', port: 465, secure: true },
  ]

  for (const cfg of configs) {
    try {
      const transporter = nodemailer.createTransport({
        ...cfg,
        auth: { user: gmailUser, pass: gmailPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      })

      await transporter.sendMail({
        from: `"SME Association Labuan" <${gmailUser}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      })

      return { sent: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Try next config if connection-level error
      if (msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('connect')) {
        continue
      }
      // Auth or other error — no point retrying different port
      return { sent: false, error: msg }
    }
  }

  return { sent: false, error: 'Could not connect to Gmail SMTP on ports 587 or 465' }
}
