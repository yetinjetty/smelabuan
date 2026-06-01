'use client'

import { useState } from 'react'
import type { AdminUser } from '@/lib/types'

export default function SettingsClient({ admins, currentAdminId, currentAdminRole }: { admins: AdminUser[], currentAdminId: string, currentAdminRole: string }) {
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'president' | 'editor'>('editor')
  const [adding, setAdding] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function callApi(path: string, body: object): Promise<{ ok: boolean; json: Record<string, unknown> }> {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    let json: Record<string, unknown> = {}
    try { json = await res.json() } catch { /* ignore */ }
    return { ok: res.ok, json }
  }

  async function addAdmin() {
    if (!newEmail || !newName) { setError('Name and email are required'); return }
    setAdding(true)
    setError('')
    setInfo('')
    const { ok, json } = await callApi('/api/admin/add-admin', { full_name: newName, email: newEmail, role: newRole })
    setAdding(false)
    if (!ok) { setError((json.error as string) ?? 'Failed to add admin'); return }
    setNewEmail('')
    setNewName('')
    setInfo('Admin added. They must log in once via OTP to activate their account.')
    window.location.reload()
  }

  async function demoteAdmin(adminId: string, name: string) {
    if (!confirm(`Demote ${name} from admin to regular member? They will lose admin access immediately.`)) return
    setLoadingId(adminId)
    setError('')
    setInfo('')
    const { ok, json } = await callApi('/api/admin/demote-admin', { adminId })
    setLoadingId(null)
    if (!ok) { setError((json.error as string) ?? 'Failed to demote admin'); return }
    const had = json.hadMemberRecord
    setInfo(
      had
        ? `${name} has been demoted. Their existing member record is unchanged.`
        : `${name} has been removed as admin. They do not have a member record.`
    )
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <div className="space-y-10">

      {/* Association details */}
      <section>
        <h2 className="text-base font-semibold text-white mb-4">Association Details</h2>
        <div className="rounded-xl border border-gray-700 p-6 space-y-3 text-sm" style={{ backgroundColor: '#1f2937' }}>
          <Row label="Name" value="SME Association Labuan" />
          <Row label="Member ID prefix" value="SMEL" />
          <Row label="Live URL" value="tanjw06.workers.dev" />
        </div>
      </section>

      {/* Membership fees */}
      <section>
        <h2 className="text-base font-semibold text-white mb-4">Membership Fees</h2>
        <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Size</th>
                <th className="px-4 py-3 text-left">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {[
                ['Life', 'Medium', 'RM 2,000 (one-time)'],
                ['Life', 'Small', 'RM 1,000 (one-time)'],
                ['Life', 'Micro', 'RM 500 (one-time)'],
                ['Ordinary', 'Medium', 'RM 200 / year'],
                ['Ordinary', 'Small', 'RM 100 / year'],
                ['Ordinary', 'Micro', 'RM 50 / year'],
                ['All', 'All', 'RM 50 entry fee (one-time)'],
              ].map(([type, size, fee]) => (
                <tr key={`${type}-${size}`} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2 text-gray-300">{type}</td>
                  <td className="px-4 py-2 text-gray-300">{size}</td>
                  <td className="px-4 py-2 font-medium text-white">{fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Contact your developer to update fee amounts.</p>
      </section>

      {/* Admin users */}
      <section>
        <h2 className="text-base font-semibold text-white mb-4">Admin Users</h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {info && <p className="text-amber-600 text-sm mb-3">{info}</p>}

        <div className="rounded-xl border border-gray-700 divide-y divide-gray-700 mb-4" style={{ backgroundColor: '#1f2937' }}>
          {admins.map(a => {
            const isSelf = a.id === currentAdminId
            const isLoading = loadingId === a.id
            return (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{a.full_name}</p>
                    {isSelf && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">You</span>
                    )}
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">{a.role}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{a.email}</p>
                </div>
                {!isSelf && !(currentAdminRole === 'editor' && a.role === 'president') && (
                  <button
                    onClick={() => demoteAdmin(a.id, a.full_name)}
                    disabled={!!loadingId}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Demoting…' : 'Demote to Member'}
                  </button>
                )}
              </div>
            )
          })}
          {!admins.length && <p className="px-4 py-6 text-sm text-gray-400 text-center">No admins</p>}
        </div>

        {/* Add admin */}
        <div className="rounded-xl border border-gray-700 p-4 space-y-3" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-sm font-medium text-gray-300">Add admin user</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Full name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className={inp}
            />
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className={inp}
            />
          </div>
          <select value={newRole} onChange={e => setNewRole(e.target.value as 'president' | 'editor')} className={inp}>
            <option value="editor">Editor</option>
            <option value="president">President</option>
          </select>
          <button
            onClick={addAdmin}
            disabled={adding}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: '#E05A4E' }}
          >
            {adding ? 'Adding…' : 'Add admin'}
          </button>
          <p className="text-xs text-gray-400">The new admin must log in once via OTP to activate their account.</p>
        </div>
      </section>

    </div>
  )
}

const inp = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E05A4E] bg-gray-800'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  )
}
