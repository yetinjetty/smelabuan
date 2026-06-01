'use client'

import { useState } from 'react'
import type { AdminUser, Member } from '@/lib/types'

type EligibleMember = Pick<Member, 'id' | 'full_name' | 'email' | 'business_name' | 'membership_type' | 'status'>
type TransferTarget =
  | { kind: 'member'; id: string; full_name: string; email: string }
  | { kind: 'admin';  id: string; full_name: string; email: string }

export default function SettingsClient({ admins, currentAdminId, currentAdminRole, eligibleMembers }: {
  admins: AdminUser[]
  currentAdminId: string
  currentAdminRole: string
  eligibleMembers: EligibleMember[]
}) {
  const [selectedMember, setSelectedMember] = useState<EligibleMember | null>(null)
  const [newRole, setNewRole] = useState<'president' | 'editor'>('editor')
  const [memberSearch, setMemberSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Transfer presidency state
  const [transferTarget, setTransferTarget] = useState<TransferTarget | null>(null)
  const [transferSearch, setTransferSearch] = useState('')
  const [selfRole, setSelfRole] = useState<'editor' | 'member'>('editor')
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState('')
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)

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
    if (!selectedMember) { setError('Please select a member'); return }
    setAdding(true)
    setError('')
    setInfo('')
    const { ok, json } = await callApi('/api/admin/add-admin', {
      full_name: selectedMember.full_name,
      email: selectedMember.email,
      role: newRole,
    })
    setAdding(false)
    if (!ok) { setError((json.error as string) ?? 'Failed to add admin'); return }
    setSelectedMember(null)
    setMemberSearch('')
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

  async function transferPresident() {
    if (!transferTarget) { setTransferError('Please select a member'); return }
    setTransferring(true)
    setTransferError('')
    const { ok, json } = await callApi('/api/admin/transfer-president', {
      targetType: transferTarget.kind,
      targetId: transferTarget.id,
      selfRole,
    })
    setTransferring(false)
    if (!ok) { setTransferError((json.error as string) ?? 'Transfer failed'); return }
    setShowTransferConfirm(false)
    setInfo(`President role transferred to ${(json as { newPresidentName: string }).newPresidentName}. The page will reload.`)
    setTimeout(() => window.location.reload(), 1800)
  }

  const filteredMembers = eligibleMembers.filter(m =>
    m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  )

  // Transfer candidates: regular members + existing editors (not self)
  const editorAdmins = admins.filter(a => a.role === 'editor')
  const transferCandidates: TransferTarget[] = [
    ...editorAdmins.map(a => ({ kind: 'admin' as const, id: a.id, full_name: a.full_name, email: a.email })),
    ...eligibleMembers.map(m => ({ kind: 'member' as const, id: m.id, full_name: m.full_name, email: m.email })),
  ].filter(t =>
    t.full_name.toLowerCase().includes(transferSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(transferSearch.toLowerCase())
  )

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

        {/* Add admin — member picker */}
        <div className="rounded-xl border border-gray-700 p-4 space-y-3" style={{ backgroundColor: '#1f2937' }}>
          <p className="text-sm font-medium text-gray-300">Promote member to admin</p>

          {/* Search */}
          <input
            placeholder="Search member by name or email…"
            value={memberSearch}
            onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null) }}
            className={inp}
          />

          {/* Selected member chip */}
          {selectedMember && (
            <div className="flex items-center justify-between rounded-lg px-3 py-2 border border-[#E05A4E] bg-[#E05A4E]/10">
              <div>
                <p className="text-sm font-medium text-white">{selectedMember.full_name}</p>
                <p className="text-xs text-gray-400">{selectedMember.email}</p>
              </div>
              <button onClick={() => { setSelectedMember(null); setMemberSearch('') }} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
            </div>
          )}

          {/* Scrollable member list */}
          {!selectedMember && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-600 divide-y divide-gray-700">
              {filteredMembers.length === 0 && (
                <p className="px-3 py-4 text-sm text-gray-500 text-center">No eligible members found</p>
              )}
              {filteredMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMember(m); setMemberSearch('') }}
                  className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{m.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{m.membership_type}</span>
                </button>
              ))}
            </div>
          )}

          {/* Role + confirm */}
          <div className="flex gap-2">
            <select value={newRole} onChange={e => setNewRole(e.target.value as 'president' | 'editor')} className={`${inp} flex-1`}>
              <option value="editor">Editor</option>
              <option value="president">President</option>
            </select>
            <button
              onClick={addAdmin}
              disabled={adding || !selectedMember}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 shrink-0"
              style={{ backgroundColor: '#E05A4E' }}
            >
              {adding ? 'Adding…' : 'Make admin'}
            </button>
          </div>
          <p className="text-xs text-gray-400">The new admin must log in once via OTP to activate their account.</p>
        </div>
      </section>

      {/* Transfer Presidency — president only */}
      {currentAdminRole === 'president' && (
        <section>
          <h2 className="text-base font-semibold text-white mb-1">Transfer Presidency</h2>
          <p className="text-xs text-gray-400 mb-4">
            Permanently transfer the president role to another member. You will be demoted immediately.
          </p>

          {transferError && <p className="text-red-500 text-sm mb-3">{transferError}</p>}

          <div className="rounded-xl border border-red-800/50 p-4 space-y-3" style={{ backgroundColor: '#1f2937' }}>
            {/* Warning banner */}
            <div className="rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2.5 text-xs text-red-300">
              ⚠ This action cannot be undone without developer assistance. The new president will have full admin control.
            </div>

            {/* Target picker */}
            <p className="text-sm font-medium text-gray-300">New president</p>
            <input
              placeholder="Search member or editor by name / email…"
              value={transferSearch}
              onChange={e => { setTransferSearch(e.target.value); setTransferTarget(null) }}
              className={inp}
            />

            {transferTarget ? (
              <div className="flex items-center justify-between rounded-lg px-3 py-2 border border-red-600 bg-red-900/20">
                <div>
                  <p className="text-sm font-medium text-white">{transferTarget.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {transferTarget.email}
                    {transferTarget.kind === 'admin' && (
                      <span className="ml-2 text-blue-400">current editor</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => { setTransferTarget(null); setTransferSearch('') }}
                  className="text-gray-400 hover:text-white text-lg leading-none"
                >×</button>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-600 divide-y divide-gray-700">
                {transferCandidates.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-gray-500 text-center">No candidates found</p>
                ) : transferCandidates.map(t => (
                  <button
                    key={`${t.kind}-${t.id}`}
                    onClick={() => { setTransferTarget(t); setTransferSearch('') }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{t.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{t.email}</p>
                    </div>
                    {t.kind === 'admin' && (
                      <span className="text-xs text-blue-400 shrink-0">Editor</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Self role after transfer */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-300">Your role after transfer</p>
              <select
                value={selfRole}
                onChange={e => setSelfRole(e.target.value as 'editor' | 'member')}
                className={`${inp} flex-1`}
              >
                <option value="editor">Stay as Editor (keep admin access)</option>
                <option value="member">Become Regular Member (lose admin access)</option>
              </select>
            </div>

            {/* Confirm step */}
            {!showTransferConfirm ? (
              <button
                onClick={() => { if (transferTarget) setShowTransferConfirm(true) }}
                disabled={!transferTarget}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white border border-red-600 hover:bg-red-900/40 disabled:opacity-40 transition-colors"
              >
                Transfer presidency…
              </button>
            ) : (
              <div className="rounded-lg border border-red-600 bg-red-900/20 p-3 space-y-3">
                <p className="text-sm text-red-300 font-medium">
                  Confirm: transfer president role to <span className="text-white">{transferTarget?.full_name}</span>?
                  You will become {selfRole === 'editor' ? 'an editor' : 'a regular member'}.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTransferConfirm(false)}
                    className="flex-1 py-2 rounded-lg text-sm text-gray-300 border border-gray-600 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={transferPresident}
                    disabled={transferring}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-700 hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {transferring ? 'Transferring…' : 'Yes, transfer now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
