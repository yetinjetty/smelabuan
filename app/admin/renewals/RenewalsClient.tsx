'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/lib/types'

export default function RenewalsClient({ overdue, dueSoon }: { overdue: Member[]; dueSoon: Member[] }) {
  return (
    <div className="space-y-8">
      <Section title="Overdue" members={overdue} badgeCls="bg-red-900/60 text-red-300" />
      <Section title="Due This Month" members={dueSoon} badgeCls="bg-yellow-900/60 text-yellow-300" />
    </div>
  )
}

function Section({ title, members, badgeCls }: { title: string; members: Member[]; badgeCls: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${badgeCls}`}>
          {members.length}
        </span>
      </div>
      {members.length > 0 ? (
        <div className="rounded-xl border border-gray-700 divide-y divide-gray-700/50" style={{ backgroundColor: '#1f2937' }}>
          {members.map(m => <MemberRow key={m.id} member={m} />)}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">None</p>
      )}
    </div>
  )
}

function MemberRow({ member }: { member: Member }) {
  const [paymentRef, setPaymentRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function approve() {
    if (!paymentRef.trim()) { setError('Enter payment reference'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: adminUser } = await supabase
      .from('admin_users').select('id').eq('auth_user_id', user?.id).single()

    const newExpiry = new Date()
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)

    const { error: updateError } = await supabase
      .from('members')
      .update({
        status: 'active',
        expiry_date: newExpiry.toISOString().split('T')[0],
        payment_ref: paymentRef,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)

    if (updateError) { setError(updateError.message); setLoading(false); return }

    await supabase.from('activity_log').insert({
      member_id: member.id,
      admin_id: adminUser?.id,
      action: 'renewed',
      details: `Renewal approved, expiry extended to ${newExpiry.toISOString().split('T')[0]}`,
      payment_ref: paymentRef,
    })

    setLoading(false)
    setDone(true)
  }

  if (done) return null

  return (
    <div className="px-5 py-4 flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold text-white">{member.full_name}</p>
        <p className="text-sm text-gray-400">{member.member_id} · {member.business_name}</p>
        <p className="text-xs text-red-400 mt-0.5">
          Expired {member.expiry_date ? format(new Date(member.expiry_date), 'd MMM yyyy') : '—'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Payment reference"
          value={paymentRef}
          onChange={e => setPaymentRef(e.target.value)}
          className="border border-gray-600 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#E05A4E] text-white placeholder-gray-500"
          style={{ backgroundColor: '#374151' }}
        />
        <button
          onClick={approve}
          disabled={loading}
          className="px-4 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: '#E05A4E' }}
        >
          {loading ? '…' : 'Approve'}
        </button>
      </div>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </div>
  )
}
