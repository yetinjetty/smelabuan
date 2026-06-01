'use client'

import { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import type { Member } from '@/lib/types'
import { PaginationBar } from '@/components/TablePagination'

export default function RenewalsClient({
  overdue, dueThisMonth, dueNextMonthCount, nextMonthName, todayStr,
}: {
  overdue: Member[]
  dueThisMonth: Member[]
  dueNextMonthCount: number
  nextMonthName: string
  todayStr: string
}) {
  const [sendingAll, setSendingAll] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [info, setInfo] = useState('')

  async function sendReminders(memberIds?: string[]) {
    const isSendAll = !memberIds
    isSendAll ? setSendingAll(true) : setSendingReminders(true)
    setInfo('')
    try {
      const res = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberIds ? { memberIds } : { sendAll: true }),
      })
      const json = await res.json()
      setInfo(json.message ?? (res.ok ? 'Reminders sent.' : 'Failed to send reminders.'))
    } catch {
      setInfo('Network error.')
    } finally {
      isSendAll ? setSendingAll(false) : setSendingReminders(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Renewals</h1>
        <div className="flex gap-3">
          <a
            href="/api/export?type=renewals"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            ↓ Export
          </a>
          <button
            onClick={() => sendReminders()}
            disabled={sendingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            ✉ {sendingAll ? 'Sending…' : 'Send reminders'}
          </button>
        </div>
      </div>

      {info && <p className="text-sm text-amber-400">{info}</p>}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Overdue"
          value={overdue.length}
          sub="Action needed"
          valueColor="#ef4444"
        />
        <StatCard
          label="Due this month"
          value={dueThisMonth.length}
          sub="Send reminders"
          valueColor="#f59e0b"
        />
        <StatCard
          label="Due next month"
          value={dueNextMonthCount}
          sub={nextMonthName}
          valueColor="#ffffff"
        />
      </div>

      {/* Overdue table */}
      <RenewalTable
        title="Overdue renewals"
        members={overdue}
        todayStr={todayStr}
        isOverdue
        onSendAllReminders={() => sendReminders(overdue.map(m => m.id))}
        sendingAll={sendingAll}
      />

      {/* Due this month table */}
      <RenewalTable
        title="Due this month"
        members={dueThisMonth}
        todayStr={todayStr}
        isOverdue={false}
        onSendAllReminders={() => sendReminders(dueThisMonth.map(m => m.id))}
        sendingAll={sendingReminders}
      />
    </div>
  )
}

function StatCard({ label, value, sub, valueColor }: {
  label: string; value: number; sub: string; valueColor: string
}) {
  return (
    <div className="rounded-xl p-5 border border-gray-700" style={{ backgroundColor: '#1f2937' }}>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className="text-4xl font-bold mb-1" style={{ color: valueColor }}>{value}</p>
      <p className="text-gray-500 text-xs">{sub}</p>
    </div>
  )
}

function RenewalTable({ title, members, todayStr, isOverdue, onSendAllReminders, sendingAll }: {
  title: string
  members: Member[]
  todayStr: string
  isOverdue: boolean
  onSendAllReminders: () => void
  sendingAll: boolean
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.ceil(members.length / pageSize)
  const paged = members.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
      <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white">{title}</h2>
          {members.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              isOverdue ? 'bg-red-900/60 text-red-300' : 'bg-yellow-900/60 text-yellow-300'
            }`}>{members.length}</span>
          )}
        </div>
        {members.length > 0 && (
          <button
            onClick={onSendAllReminders}
            disabled={sendingAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 text-xs font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            ✉ {sendingAll ? 'Sending…' : 'Send all reminders'}
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-500 text-center">None</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  {['Member ID', 'Member', 'Type', 'Size', isOverdue ? 'Expired on' : 'Due on', 'Days', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {paged.map(m => (
                  <RenewalRow key={m.id} member={m} todayStr={todayStr} isOverdue={isOverdue} />
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={page} totalPages={totalPages} total={members.length} pageSize={pageSize}
            onPageChange={p => setPage(p)}
            onPageSizeChange={ps => { setPageSize(ps); setPage(1) }}
          />
        </>
      )}
    </div>
  )
}

function RenewalRow({ member, todayStr, isOverdue }: { member: Member; todayStr: string; isOverdue: boolean }) {
  const [paymentRef, setPaymentRef] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const expiryDate = member.expiry_date ? new Date(member.expiry_date) : null
  const today = new Date(todayStr)
  const dayDiff = expiryDate ? Math.abs(differenceInDays(today, expiryDate)) : 0
  const daysLabel = isOverdue ? dayDiff : dayDiff
  const daysColor = isOverdue
    ? dayDiff > 20 ? '#ef4444' : dayDiff > 7 ? '#f59e0b' : '#f59e0b'
    : '#f59e0b'

  async function approve() {
    if (!paymentRef.trim()) { setError('Payment reference required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, membershipType: member.membership_type, isRenewal: true, paymentRef }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed'); return }
      setDone(true)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-gray-400">{member.member_id ?? '—'}</td>
      <td className="px-4 py-3">
        <p className="text-white font-medium truncate max-w-[140px]">{member.full_name}</p>
        <p className="text-xs text-gray-500 truncate max-w-[140px]">{member.business_name ?? ''}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs px-2 py-0.5 rounded-full border border-gray-600 text-gray-300">
          {member.membership_type ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          member.business_size === 'Micro' ? 'bg-orange-900/40 text-orange-300' :
          member.business_size === 'Small' ? 'bg-green-900/40 text-green-300' :
          'bg-blue-900/40 text-blue-300'
        }`}>
          {member.business_size ?? '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">
        {expiryDate ? format(expiryDate, 'd MMM yyyy') : '—'}
      </td>
      <td className="px-4 py-3 font-bold text-sm" style={{ color: daysColor }}>
        {dayDiff}
      </td>
      <td className="px-4 py-3">
        {showInput ? (
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Payment ref."
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                className="border border-gray-600 rounded-lg px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-[#E05A4E] text-white placeholder-gray-500"
                style={{ backgroundColor: '#374151' }}
              />
              <button
                onClick={approve}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-white text-xs font-medium disabled:opacity-60"
                style={{ backgroundColor: '#E05A4E' }}
              >
                {loading ? '…' : 'Confirm'}
              </button>
              <button onClick={() => setShowInput(false)} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
            </div>
            {error && <p className="text-red-400 text-[10px]">{error}</p>}
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 text-xs font-medium hover:bg-gray-700 transition-colors"
          >
            Approve
          </button>
        )}
      </td>
    </tr>
  )
}
