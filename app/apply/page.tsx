'use client'

import { useState, useRef } from 'react'

type MembershipType = 'Life' | 'Ordinary'
type SectorCategory = 'Manufacturing' | 'Services'
type BusinessSize = 'Micro' | 'Small' | 'Medium'

const SECTOR_OPTIONS: { value: string; label: string }[] = [
  // Manufacturing
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Assembly', label: 'Assembly' },
  // Services & Others
  { value: 'Trading', label: 'Trading' },
  { value: 'F&B', label: 'Food & Beverage' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Services', label: 'Services' },
  { value: 'Other', label: 'Other' },
]

const MFG_SECTORS = ['Manufacturing', 'Processing', 'Assembly']

const ANNUAL_FEES: Record<BusinessSize, number> = { Micro: 50, Small: 100, Medium: 200 }
const LIFE_FEES: Record<BusinessSize, number> = { Micro: 500, Small: 1000, Medium: 2000 }
const ENTRY_FEE = 50

function fmt(n: number) { return `RM ${n.toLocaleString()}` }

function feeLabel(type: MembershipType, size: BusinessSize) {
  if (type === 'Life') return `${fmt(LIFE_FEES[size])} (one-time)`
  return `${fmt(ANNUAL_FEES[size])} / year`
}

function dueNow(type: MembershipType, size: BusinessSize) {
  if (type === 'Life') return LIFE_FEES[size] + ENTRY_FEE
  return ANNUAL_FEES[size] + ENTRY_FEE
}

// ─── Shared UI ───────────────────────────────────────────────────────────────

function StepHeader({ title, subtitle, step, onBack }: { title: string; subtitle: string; step: number; onBack?: () => void }) {
  return (
    <div style={{ backgroundColor: '#E05A4E' }} className="px-5 pt-14 pb-5">
      <div className="flex items-center gap-3 mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <span className="text-white text-lg leading-none">←</span>
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">{title}</h1>
          <p className="text-white/70 text-sm">Step {step} of 5 — {subtitle}</p>
        </div>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>
    </div>
  )
}

function RadioCard({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border p-4 flex items-start gap-3 transition-all"
      style={{
        backgroundColor: checked ? '#ffffff' : '#1f2937',
        borderColor: checked ? '#E05A4E' : '#374151',
      }}
    >
      <div className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
        style={{ borderColor: checked ? '#E05A4E' : '#6b7280' }}>
        {checked && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E05A4E' }} />}
      </div>
      <div>{children}</div>
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-xs font-medium tracking-widest uppercase mb-3" style={{ color: '#9ca3af' }}>
      {children}
    </p>
  )
}

function InputField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#d1d5db' }}>
        {label}{required && <span style={{ color: '#E05A4E' }}> *</span>}
      </label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E05A4E]'
const inputStyle = { backgroundColor: '#1f2937', border: '1px solid #374151' }

function ContinueBtn({ label = 'Continue →', onClick, disabled }: { label?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-50 transition-opacity"
      style={{ backgroundColor: '#111827' }}
    >
      {label}
    </button>
  )
}

function InfoBox({ icon = 'ℹ', color = '#E05A4E', children }: { icon?: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: '#fff1f0', border: `1px solid #fecaca` }}>
      <span style={{ color }}>{icon}</span>
      <p className="text-sm font-medium" style={{ color }}>{children}</p>
    </div>
  )
}

function FileUpload({ label, file, onFile, accept = '.jpg,.jpeg,.png,.pdf' }: {
  label: string; file: File | null; onFile: (f: File | null) => void; accept?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => onFile(e.target.files?.[0] ?? null)} />
      {file ? (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
          <span className="text-green-600">✓</span>
          <span className="text-sm text-green-800 flex-1 truncate">{file.name}</span>
          <button type="button" onClick={() => onFile(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed py-8 flex flex-col items-center gap-2 transition-colors"
          style={{ borderColor: '#4b5563', backgroundColor: '#1f2937' }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#374151' }}>
            <span style={{ color: '#E05A4E', fontSize: 22 }}>⊞</span>
          </div>
          <span className="font-medium text-sm text-white">{label}</span>
          <span className="text-xs" style={{ color: '#9ca3af' }}>JPG, PNG or PDF · max 5MB</span>
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplyPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 1
  const [membershipType, setMembershipType] = useState<MembershipType>('Ordinary')

  // Step 2
  const [sectorCategory, setSectorCategory] = useState<SectorCategory>('Services')
  const [businessSize, setBusinessSize] = useState<BusinessSize>('Medium')

  // Step 3
  const [fullName, setFullName] = useState('')
  const [icNumber, setIcNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [ssmRegNo, setSsmRegNo] = useState('')
  const [businessSector, setBusinessSector] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [hasDifferentRep, setHasDifferentRep] = useState(false)
  const [repName, setRepName] = useState('')
  const [repIc, setRepIc] = useState('')
  const [repPhone, setRepPhone] = useState('')

  // Step 4
  const [icFile, setIcFile] = useState<File | null>(null)
  const [ssmFile, setSsmFile] = useState<File | null>(null)

  function validateStep3() {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Full name is required'
    if (!icNumber.trim()) e.icNumber = 'IC number is required'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email is required'
    if (!phone.trim()) e.phone = 'Mobile number is required'
    if (!businessName.trim()) e.businessName = 'Business name is required'
    if (!ssmRegNo.trim()) e.ssmRegNo = 'SSM registration number is required'
    if (!businessSector) e.businessSector = 'Please select a business sector'
    if (!businessAddress.trim()) e.businessAddress = 'Business address is required'
    if (hasDifferentRep) {
      if (!repName.trim()) e.repName = 'Representative name is required'
      if (!repIc.trim()) e.repIc = 'Representative IC is required'
      if (!repPhone.trim()) e.repPhone = 'Representative phone is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep4() {
    const e: Record<string, string> = {}
    if (!icFile) e.icFile = 'IC copy is required'
    if (!ssmFile) e.ssmFile = 'SSM certificate is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    setSubmitting(true)
    setServerError('')
    try {
      const formData = new FormData()
      formData.append('full_name', fullName)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('business_name', businessName)
      formData.append('business_sector', businessSector)
      formData.append('business_size', businessSize)
      formData.append('membership_type', membershipType)
      formData.append('ic_number', icNumber)
      formData.append('ssm_reg_no', ssmRegNo)
      formData.append('business_address', businessAddress)
      formData.append('sector_category', sectorCategory)
      if (hasDifferentRep) {
        formData.append('rep_name', repName)
        formData.append('rep_ic', repIc)
        formData.append('rep_phone', repPhone)
      }
      if (icFile) formData.append('ic_document', icFile)
      if (ssmFile) formData.append('ssm_document', ssmFile)

      const res = await fetch('/api/apply', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Submission failed. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setServerError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Submitted ──
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#111827' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: '#dcfce7' }}>
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Application Submitted</h1>
        <p className="mt-2 max-w-xs text-sm" style={{ color: '#9ca3af' }}>
          Thank you! The secretariat will review your application and contact you at <strong className="text-white">{email}</strong> shortly.
        </p>
        <a href="/login" className="mt-6 text-sm underline" style={{ color: '#E05A4E' }}>Back to login</a>
      </div>
    )
  }

  const availableSectors = SECTOR_OPTIONS.filter(s =>
    sectorCategory === 'Manufacturing' ? MFG_SECTORS.includes(s.value) : !MFG_SECTORS.includes(s.value)
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111827' }}>

      {/* ── STEP 1 — Membership type ── */}
      {step === 1 && (
        <>
          <StepHeader title="Apply for membership" subtitle="Choose membership type" step={1} />
          <div className="flex-1 flex flex-col px-4 py-6 gap-4">
            <RadioCard checked={membershipType === 'Life'} onClick={() => setMembershipType('Life')}>
              <p className="font-semibold text-sm" style={{ color: membershipType === 'Life' ? '#111827' : '#ffffff' }}>Life Member</p>
              <p className="text-xs mt-0.5" style={{ color: membershipType === 'Life' ? '#6b7280' : '#9ca3af' }}>
                Permanent membership with no annual renewal. One-time payment based on business size.
              </p>
            </RadioCard>

            <RadioCard checked={membershipType === 'Ordinary'} onClick={() => setMembershipType('Ordinary')}>
              <p className="font-semibold text-sm" style={{ color: membershipType === 'Ordinary' ? '#111827' : '#ffffff' }}>Ordinary Member</p>
              <p className="text-xs mt-0.5" style={{ color: membershipType === 'Ordinary' ? '#6b7280' : '#9ca3af' }}>
                For SME owners and business operators registered in Labuan. Annual subscription.
              </p>
            </RadioCard>

            <InfoBox>
              Fees vary by business sector and size. You will select these in the next step.
            </InfoBox>

            <div className="flex-1" />
            <ContinueBtn onClick={() => setStep(2)} />
          </div>
        </>
      )}

      {/* ── STEP 2 — Business size ── */}
      {step === 2 && (
        <>
          <StepHeader title="Business size" subtitle="Sector & business category" step={2} onBack={() => setStep(1)} />
          <div className="flex-1 flex flex-col px-4 py-6 gap-4 overflow-y-auto">

            {/* Sector category */}
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: '#d1d5db' }}>Business sector type</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'Manufacturing', icon: '🏭', label: 'Manufacturing', sub: 'Production, processing, assembly' },
                  { value: 'Services', icon: '🛍', label: 'Services & Others', sub: 'Trading, F&B, logistics, finance…' },
                ] as { value: SectorCategory; icon: string; label: string; sub: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setSectorCategory(opt.value); setBusinessSector('') }}
                    className="rounded-2xl p-4 text-center transition-all"
                    style={{
                      backgroundColor: sectorCategory === opt.value ? '#fff1f0' : '#1f2937',
                      border: `2px solid ${sectorCategory === opt.value ? '#E05A4E' : '#374151'}`,
                    }}
                  >
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <p className="font-semibold text-sm" style={{ color: sectorCategory === opt.value ? '#E05A4E' : '#ffffff' }}>
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: sectorCategory === opt.value ? '#E05A4E' : '#9ca3af' }}>
                      {opt.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria note */}
            <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: '#1f2937' }}>
              Select the category that best describes your business. You qualify if you meet <strong className="text-white">either</strong> the turnover or employee criteria.
              <span style={{ color: '#9ca3af' }}> </span>
            </div>

            {/* Business size */}
            <div className="space-y-3">
              {([
                {
                  value: 'Medium',
                  label: 'Medium enterprise',
                  turnover: 'Sales turnover RM 3M to ≤ RM 20M',
                  employees: 'Full-time employees 30 to ≤ 75 workers',
                },
                {
                  value: 'Small',
                  label: 'Small enterprise',
                  turnover: 'Sales turnover RM 300K to < RM 3M',
                  employees: 'Full-time employees 5 to < 30 workers',
                },
                {
                  value: 'Micro',
                  label: 'Micro enterprise',
                  turnover: 'Sales turnover less than RM 300K',
                  employees: 'Full-time employees fewer than 5 workers',
                },
              ] as { value: BusinessSize; label: string; turnover: string; employees: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBusinessSize(opt.value)}
                  className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all"
                  style={{
                    backgroundColor: businessSize === opt.value ? '#fff1f0' : '#1f2937',
                    border: `1.5px solid ${businessSize === opt.value ? '#E05A4E' : '#374151'}`,
                  }}
                >
                  <div className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: businessSize === opt.value ? '#E05A4E' : '#6b7280' }}>
                    {businessSize === opt.value && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E05A4E' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: businessSize === opt.value ? '#E05A4E' : '#ffffff' }}>
                      {opt.label}
                    </p>
                    <p className="text-xs mt-1 font-medium" style={{ color: businessSize === opt.value ? '#7f1d1d' : '#d1d5db' }}>
                      {opt.turnover}
                    </p>
                    <p className="text-xs my-0.5" style={{ color: businessSize === opt.value ? '#b45309' : '#6b7280' }}>OR</p>
                    <p className="text-xs font-medium" style={{ color: businessSize === opt.value ? '#7f1d1d' : '#d1d5db' }}>
                      {opt.employees}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Fee summary */}
            <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#fff1f0', border: '1px solid #fecaca' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#E05A4E' }}>Fee summary</p>
              {[
                ['Membership type', `${membershipType} Member`],
                ['Sector type', sectorCategory === 'Manufacturing' ? 'Manufacturing' : 'Services & Others'],
                ['Business size', businessSize],
                [membershipType === 'Life' ? 'One-time fee' : 'Subscription', feeLabel(membershipType, businessSize)],
                ['Entry fee (one-time)', 'RM 50'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: '#E05A4E' }}>{label}</span>
                  <span className="font-medium" style={{ color: '#E05A4E' }}>{value}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between" style={{ borderColor: '#fca5a5' }}>
                <span className="text-sm font-semibold" style={{ color: '#E05A4E' }}>
                  Due now {membershipType === 'Ordinary' ? '(1st year)' : ''}
                </span>
                <span className="font-bold text-base" style={{ color: '#E05A4E' }}>
                  RM {dueNow(membershipType, businessSize).toLocaleString()}
                </span>
              </div>
            </div>

            <InfoBox icon="ℹ">
              If your business qualifies under more than one size, the smaller category applies.
            </InfoBox>

            <ContinueBtn onClick={() => setStep(3)} />
          </div>
        </>
      )}

      {/* ── STEP 3 — Personal details ── */}
      {step === 3 && (
        <>
          <StepHeader title="Personal details" subtitle="About you and your business" step={3} onBack={() => setStep(2)} />
          <div className="flex-1 flex flex-col px-4 py-6 gap-5 overflow-y-auto">

            {/* Registered person */}
            <div>
              <SectionLabel>Registered person</SectionLabel>
              <div className="space-y-3">
                <InputField label="Full name (as per IC)" required error={errors.fullName}>
                  <input
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Ahmad bin Hassan"
                    className={inputCls} style={inputStyle}
                  />
                </InputField>
                <InputField label="IC number" required error={errors.icNumber}>
                  <input
                    value={icNumber} onChange={e => setIcNumber(e.target.value)}
                    placeholder="e.g. 800101-12-3456"
                    className={inputCls} style={inputStyle}
                  />
                </InputField>
                <InputField label="Email address" required error={errors.email}>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@email.com"
                    className={inputCls} style={inputStyle}
                  />
                </InputField>
                <InputField label="Mobile number" required error={errors.phone}>
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    className={inputCls} style={inputStyle}
                  />
                </InputField>
              </div>
            </div>

            {/* Business info */}
            <div>
              <SectionLabel>Business information</SectionLabel>
              <div className="space-y-3">
                <InputField label="Business name" required error={errors.businessName}>
                  <input
                    value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Ahmad Trading Sdn Bhd"
                    className={inputCls} style={inputStyle}
                  />
                </InputField>
                <InputField label="SSM registration no." required error={errors.ssmRegNo}>
                  <input
                    value={ssmRegNo} onChange={e => setSsmRegNo(e.target.value)}
                    placeholder="e.g. 202301012345"
                    className={inputCls} style={inputStyle}
                  />
                </InputField>
                <InputField label="Business sector" required error={errors.businessSector}>
                  <select
                    value={businessSector} onChange={e => setBusinessSector(e.target.value)}
                    className={inputCls} style={{ ...inputStyle, color: businessSector ? '#ffffff' : '#6b7280' }}
                  >
                    <option value="">Select sector…</option>
                    {availableSectors.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </InputField>
                <InputField label="Business address in Labuan" required error={errors.businessAddress}>
                  <textarea
                    value={businessAddress} onChange={e => setBusinessAddress(e.target.value)}
                    placeholder="Unit, building, road, Labuan FT"
                    rows={3}
                    className={inputCls} style={{ ...inputStyle, resize: 'none' }}
                  />
                </InputField>
              </div>
            </div>

            {/* Nominated rep */}
            <div>
              <SectionLabel>Nominated representative</SectionLabel>
              <button
                type="button"
                onClick={() => setHasDifferentRep(v => !v)}
                className="w-full flex items-center justify-between rounded-2xl p-4"
                style={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-white">Different from registered person?</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Turn on to enter representative details</p>
                </div>
                <div
                  className="w-12 h-7 rounded-full flex items-center px-1 transition-all"
                  style={{ backgroundColor: hasDifferentRep ? '#E05A4E' : '#374151' }}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{ transform: hasDifferentRep ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </div>
              </button>

              {hasDifferentRep && (
                <div className="mt-3 space-y-3">
                  <InputField label="Representative full name" required error={errors.repName}>
                    <input value={repName} onChange={e => setRepName(e.target.value)} className={inputCls} style={inputStyle} />
                  </InputField>
                  <InputField label="Representative IC number" required error={errors.repIc}>
                    <input value={repIc} onChange={e => setRepIc(e.target.value)} placeholder="e.g. 900101-12-3456" className={inputCls} style={inputStyle} />
                  </InputField>
                  <InputField label="Representative mobile number" required error={errors.repPhone}>
                    <input type="tel" value={repPhone} onChange={e => setRepPhone(e.target.value)} placeholder="+60 12-345 6789" className={inputCls} style={inputStyle} />
                  </InputField>
                </div>
              )}
            </div>

            <ContinueBtn onClick={() => { if (validateStep3()) setStep(4) }} />
          </div>
        </>
      )}

      {/* ── STEP 4 — Supporting documents ── */}
      {step === 4 && (
        <>
          <StepHeader title="Supporting documents" subtitle="Upload required files" step={4} onBack={() => setStep(3)} />
          <div className="flex-1 flex flex-col px-4 py-6 gap-5">
            <InputField label="IC copy (front & back)" required error={errors.icFile}>
              <FileUpload label="Upload IC copy" file={icFile} onFile={setIcFile} />
            </InputField>
            <InputField label="SSM business registration cert." required error={errors.ssmFile}>
              <FileUpload label="Upload SSM certificate" file={ssmFile} onFile={setSsmFile} />
            </InputField>

            <div className="rounded-2xl p-4 flex gap-3" style={{ backgroundColor: '#fff1f0', border: '1px solid #fecaca' }}>
              <span style={{ color: '#E05A4E' }}>🔒</span>
              <p className="text-sm font-medium" style={{ color: '#E05A4E' }}>
                Documents are stored securely and only accessible to the secretariat for verification.
              </p>
            </div>

            <div className="flex-1" />
            <ContinueBtn label="Review application →" onClick={() => { if (validateStep4()) setStep(5) }} />
          </div>
        </>
      )}

      {/* ── STEP 5 — Review & submit ── */}
      {step === 5 && (
        <>
          <StepHeader title="Review application" subtitle="Confirm your details" step={5} onBack={() => setStep(4)} />
          <div className="flex-1 flex flex-col px-4 py-6 gap-4 overflow-y-auto">

            {/* Summary card */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}>
              {[
                ['Membership type', `${membershipType} Member`],
                ['Business size', businessSize],
                ['Sector', `${sectorCategory === 'Manufacturing' ? 'Manufacturing' : 'Services & Others'} — ${businessSector}`],
                ['Full name', fullName],
                ['IC number', icNumber],
                ['Email', email],
                ['Phone', phone],
                ['Business name', businessName],
                ['SSM reg. no.', ssmRegNo],
                ['Business address', businessAddress],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3 px-4 py-3 border-b" style={{ borderColor: '#374151' }}>
                  <span className="text-xs w-28 shrink-0" style={{ color: '#9ca3af' }}>{label}</span>
                  <span className="text-sm text-white flex-1">{value}</span>
                </div>
              ))}
              {hasDifferentRep && [
                ['Rep. name', repName],
                ['Rep. IC', repIc],
                ['Rep. phone', repPhone],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3 px-4 py-3 border-b" style={{ borderColor: '#374151' }}>
                  <span className="text-xs w-28 shrink-0" style={{ color: '#9ca3af' }}>{label}</span>
                  <span className="text-sm text-white flex-1">{value}</span>
                </div>
              ))}
              <div className="flex gap-3 px-4 py-3 border-b" style={{ borderColor: '#374151' }}>
                <span className="text-xs w-28 shrink-0" style={{ color: '#9ca3af' }}>IC document</span>
                <span className="text-sm text-white flex-1 truncate">{icFile?.name ?? '—'}</span>
              </div>
              <div className="flex gap-3 px-4 py-3">
                <span className="text-xs w-28 shrink-0" style={{ color: '#9ca3af' }}>SSM document</span>
                <span className="text-sm text-white flex-1 truncate">{ssmFile?.name ?? '—'}</span>
              </div>
            </div>

            {/* Fee due */}
            <div className="rounded-2xl p-4 flex justify-between items-center" style={{ backgroundColor: '#fff1f0', border: '1px solid #fecaca' }}>
              <span className="text-sm font-semibold" style={{ color: '#E05A4E' }}>
                Due now {membershipType === 'Ordinary' ? '(1st year)' : ''}
              </span>
              <span className="text-lg font-bold" style={{ color: '#E05A4E' }}>
                RM {dueNow(membershipType, businessSize).toLocaleString()}
              </span>
            </div>

            <p className="text-xs text-center" style={{ color: '#6b7280' }}>
              By submitting, you confirm all information is accurate. Payment details will be provided upon approval.
            </p>

            {serverError && <p className="text-sm text-center" style={{ color: '#f87171' }}>{serverError}</p>}

            <ContinueBtn label={submitting ? 'Submitting…' : 'Submit application'} disabled={submitting} />
          </div>
        </>
      )}
    </div>
  )
}
