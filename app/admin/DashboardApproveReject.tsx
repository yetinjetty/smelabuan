'use client'

import { useState } from 'react'

export default function DashboardApproveReject({
  memberId,
  membershipType,
  memberName,
}: {
  memberId: string
  membershipType: string
  memberName: string
}) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState('')

  async function act(action: 'approve' | 'reject') {
    setLoading(action)
    setError('')
    try {
      const url = action === 'approve' ? '/api/admin/approve' : '/api/admin/reject'
      const body = action === 'approve'
        ? { memberId, membershipType }
        : { memberId }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? `${action} failed`); return }
      setDone(action === 'approve' ? 'approved' : 'rejected')
    } catch {
      setError('Network error')
    } finally {
      setLoading(null)
    }
  }

  if (done) {
    return (
      <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
        done === 'approved' ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
      }`}>
        {done === 'approved' ? '✓ Approved' : '✗ Rejected'}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-red-400 text-[10px]">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => act('approve')}
          disabled={!!loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900 bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {loading === 'approve' ? '…' : 'Approve'}
        </button>
        <button
          onClick={() => act('reject')}
          disabled={!!loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white border border-gray-600 hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading === 'reject' ? '…' : 'Reject'}
        </button>
      </div>
    </div>
  )
}
