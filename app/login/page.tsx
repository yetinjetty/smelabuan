'use client'

// createClient() is intentionally NOT called at module/component level —
// only inside event handlers — so Next.js prerender never touches Supabase.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Step 1: verify email is registered — fail closed (any error = block)
      let allowed = false
      let reason = 'This email is not registered. Please apply for membership first.'

      try {
        const checkRes = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const check = await checkRes.json()
        allowed = check.allowed === true
        if (check.reason) reason = check.reason
      } catch {
        allowed = false
        reason = 'Unable to verify registration. Please try again.'
      }

      if (!allowed) {
        setError(reason)
        return
      }

      // Step 2: send OTP only if check passed
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })

      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) {
      setLoading(false)
      setError('Invalid or expired code. Please try again.')
      return
    }
    if (data.user) {
      // Link auth_user_id via server API (service role bypasses RLS)
      await fetch('/api/auth/link', { method: 'POST' })

      // Store session persistence preference
      if (rememberMe) {
        const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000
        localStorage.setItem('sme_remember_until', String(sevenDays))
        sessionStorage.removeItem('sme_session')
      } else {
        sessionStorage.setItem('sme_session', 'active')
        localStorage.removeItem('sme_remember_until')
      }

      // Check if admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .single()

      router.push(adminUser ? '/admin' : '/home')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white text-2xl font-bold"
            style={{ backgroundColor: '#E05A4E' }}
          >
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SME Association Labuan</h1>
          <p className="text-gray-500 text-sm mt-1">Member Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {!sent ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A4E] focus:border-transparent"
                />
              </div>
              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#E05A4E]"
                />
                <span className="text-sm text-gray-600">Stay logged in for 7 days</span>
              </label>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
                style={{ backgroundColor: '#E05A4E' }}
              >
                {loading ? 'Sending…' : 'Send login code'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600">
                We sent a code to <strong>{email}</strong>. Enter it below.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  One-time code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-[#E05A4E] focus:border-transparent"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
                style={{ backgroundColor: '#E05A4E' }}
              >
                {loading ? 'Verifying…' : 'Verify code'}
              </button>
              <button
                type="button"
                onClick={() => { setSent(false); setOtp(''); setError('') }}
                className="w-full text-sm text-gray-500 underline"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Not a member?{' '}
          <a href="/apply" className="underline" style={{ color: '#E05A4E' }}>
            Apply here
          </a>
        </p>
      </div>
    </div>
  )
}
