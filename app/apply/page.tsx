'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7, 'Phone number required'),
  business_name: z.string().min(2, 'Business name required'),
  business_sector: z.string().min(1, 'Select a sector'),
  business_size: z.enum(['Micro', 'Small', 'Medium']),
  membership_type: z.enum(['Life', 'Ordinary']),
})

type FormData = z.infer<typeof schema>

const SECTORS = ['Manufacturing', 'Services', 'Trading', 'Construction', 'Agriculture', 'Technology', 'Other']

const FEES: Record<string, Record<string, string>> = {
  Life: { Micro: 'RM 500 (one-time)', Small: 'RM 1,000 (one-time)', Medium: 'RM 2,000 (one-time)' },
  Ordinary: { Micro: 'RM 50 / year', Small: 'RM 100 / year', Medium: 'RM 200 / year' },
}

export default function ApplyPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { business_size: 'Micro', membership_type: 'Ordinary' },
  })

  const businessSize = watch('business_size')
  const membershipType = watch('membership_type')

  async function next(fields: (keyof FormData)[]) {
    const ok = await trigger(fields)
    if (ok) setStep(s => s + 1)
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    setServerError('')
    const supabase = createClient()
    const { error } = await supabase.from('members').insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      business_name: data.business_name,
      business_sector: data.business_sector,
      business_size: data.business_size,
      membership_type: data.membership_type,
      status: 'pending',
    })
    setSubmitting(false)
    if (error) {
      if (error.code === '23505') setServerError('This email is already registered.')
      else setServerError('Submission failed. Please try again.')
    } else {
      // Send confirmation + admin notification emails
      await fetch('/api/notify-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.full_name,
          email: data.email,
          business_name: data.business_name,
          membership_type: data.membership_type,
          business_size: data.business_size,
        }),
      })
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Application Submitted</h1>
        <p className="text-gray-500 mt-2 max-w-xs">
          Thank you! The secretariat will review your application and contact you shortly.
        </p>
        <a href="/login" className="mt-6 text-sm underline" style={{ color: '#E05A4E' }}>
          Back to login
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Membership Application</h1>
          <p className="text-gray-500 text-sm mt-1">SME Association Labuan</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-[#E05A4E]' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <h2 className="font-semibold text-gray-900">Personal Details</h2>
                <Field label="Full name" error={errors.full_name?.message}>
                  <input {...register('full_name')} placeholder="As per IC" className={inputCls} />
                </Field>
                <Field label="Email address" error={errors.email?.message}>
                  <input {...register('email')} type="email" className={inputCls} />
                </Field>
                <Field label="Phone number" error={errors.phone?.message}>
                  <input {...register('phone')} type="tel" placeholder="+60 12-345 6789" className={inputCls} />
                </Field>
                <button type="button" onClick={() => next(['full_name', 'email', 'phone'])} className={btnCls}>
                  Next
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-semibold text-gray-900">Business Details</h2>
                <Field label="Business name" error={errors.business_name?.message}>
                  <input {...register('business_name')} className={inputCls} />
                </Field>
                <Field label="Business sector" error={errors.business_sector?.message}>
                  <select {...register('business_sector')} className={inputCls}>
                    <option value="">Select sector…</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Business size" error={errors.business_size?.message}>
                  <select {...register('business_size')} className={inputCls}>
                    <option value="Micro">Micro (&lt;5 employees)</option>
                    <option value="Small">Small (5–75 employees)</option>
                    <option value="Medium">Medium (76–200 employees)</option>
                  </select>
                </Field>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setStep(1)} className={`${btnCls} bg-gray-100 !text-gray-700`}>Back</button>
                  <button type="button" onClick={() => next(['business_name', 'business_sector', 'business_size'])} className={btnCls}>Next</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-semibold text-gray-900">Membership Type</h2>
                <div className="space-y-3">
                  {(['Ordinary', 'Life'] as const).map(type => (
                    <label
                      key={type}
                      className={`block border rounded-xl p-4 cursor-pointer transition-colors ${
                        membershipType === type ? 'border-[#E05A4E] bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <input {...register('membership_type')} type="radio" value={type} className="sr-only" />
                      <p className="font-semibold text-gray-900">{type} Membership</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {type === 'Life' ? 'One-time payment, lifetime access' : 'Annual renewal required'}
                      </p>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setStep(2)} className={`${btnCls} bg-gray-100 !text-gray-700`}>Back</button>
                  <button type="button" onClick={() => next(['membership_type'])} className={btnCls}>Next</button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-semibold text-gray-900">Fee Summary</h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Membership fee</span>
                    <span className="font-medium">{FEES[membershipType]?.[businessSize] ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Entry fee (all new members)</span>
                    <span className="font-medium">RM 50.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Total due on approval</span>
                    <span style={{ color: '#E05A4E' }}>See above</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Payment is via bank transfer. The secretariat will provide account details upon approval.
                </p>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setStep(3)} className={`${btnCls} bg-gray-100 !text-gray-700`}>Back</button>
                  <button type="button" onClick={() => setStep(5)} className={btnCls}>Next</button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="font-semibold text-gray-900">Review & Submit</h2>
                <p className="text-sm text-gray-500">
                  By submitting, you confirm that all information provided is accurate and you agree to the association's terms.
                </p>
                {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setStep(4)} className={`${btnCls} bg-gray-100 !text-gray-700`}>Back</button>
                  <button type="submit" disabled={submitting} className={`${btnCls} disabled:opacity-60`}>
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A4E] focus:border-transparent'
const btnCls = 'w-full py-3 rounded-xl text-white font-semibold text-sm bg-[#E05A4E]'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
