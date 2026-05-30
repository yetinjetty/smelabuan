'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import type { Member } from '@/lib/types'

export default function MembersTable({
  members, total, page, pageSize, status, q,
}: {
  members: Member[]
  total: number
  page: number
  pageSize: number
  status?: string
  q?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(q ?? '')
  const [filter, setFilter] = useState(status ?? '')
  const [selected, setSelected] = useState<Member | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState('')

  function applyFilters(newSearch: string, newFilter: string) {
    const params = new URLSearchParams()
    if (newSearch) params.set('q', newSearch)
    if (newFilter) params.set('status', newFilter)
    params.set('page', '1')
    router.push(`/admin/members?${params}`)
  }

  async function approveMember(member: Member) {
    setActionError('')
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id, membershipType: member.membership_type }),
    })
    const json = await res.json()
    if (!res.ok) { setActionError(json.error ?? 'Approval failed'); return }
    setSelected(null)
    startTransition(() => router.refresh())
  }

  async function rejectMember(member: Member) {
    setActionError('')
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id }),
    })
    const json = await res.json()
    if (!res.ok) { setActionError(json.error ?? 'Rejection failed'); return }
    setSelected(null)
    startTransition(() => router.refresh())
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search name, email, ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyFilters(search, filter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#E05A4E]"
        />
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); applyFilters(search, e.target.value) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A4E]"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
        <button
          onClick={() => applyFilters(search, filter)}
          className="px-4 py-2 text-sm rounded-lg text-white font-medium"
          style={{ backgroundColor: '#E05A4E' }}
        >
          Search
        </button>
        <span className="text-sm text-gray-500 self-center">{total} result{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Member ID</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Business</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Expiry</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map(m => (
                <tr
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.full_name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{m.member_id || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.membership_type ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 truncate max-w-[160px]">{m.business_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{m.business_sector ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.expiry_date ? format(new Date(m.expiry_date), 'd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {format(new Date(m.created_at), 'd MMM yyyy')}
                  </td>
                </tr>
              ))}
              {!members.length && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No members found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <button
                  onClick={() => { const p = new URLSearchParams(); if (q) p.set('q', q); if (status) p.set('status', status); p.set('page', String(page - 1)); router.push(`/admin/members?${p}`) }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              {page < totalPages && (
                <button
                  onClick={() => { const p = new URLSearchParams(); if (q) p.set('q', q); if (status) p.set('status', status); p.set('page', String(page + 1)); router.push(`/admin/members?${p}`) }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Member detail drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Member Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <dl className="space-y-4 text-sm">
              {[
                ['Full name', selected.full_name],
                ['Email', selected.email],
                ['Phone', selected.phone ?? '—'],
                ['Member ID', selected.member_id || '—'],
                ['Membership type', selected.membership_type ?? '—'],
                ['Status', selected.status],
                ['Business name', selected.business_name ?? '—'],
                ['Business sector', selected.business_sector ?? '—'],
                ['Business size', selected.business_size ?? '—'],
                ['Member since', selected.member_since ? format(new Date(selected.member_since), 'd MMM yyyy') : '—'],
                ['Expiry date', selected.expiry_date ? format(new Date(selected.expiry_date), 'd MMM yyyy') : '—'],
                ['Payment ref', selected.payment_ref ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-gray-500 shrink-0">{k}</dt>
                  <dd className="text-gray-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>

            {actionError && <p className="text-red-500 text-sm mt-4">{actionError}</p>}

            {selected.status === 'pending' && (
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => approveMember(selected)}
                  className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm bg-green-600 hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectMember(selected)}
                  className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm bg-red-500 hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active' ? 'bg-green-100 text-green-700' :
    status === 'expired' ? 'bg-red-100 text-red-700' :
    'bg-yellow-100 text-yellow-700'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>
}
