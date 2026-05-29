'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AdminUser } from '@/lib/types'

export default function SettingsClient({ admins }: { admins: AdminUser[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'president' | 'editor'>('editor')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [error, setError] = useState('')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')

  async function addAdmin() {
    if (!newEmail || !newName) { setError('Name and email required'); return }
    setAddingAdmin(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('admin_users').insert({
      full_name: newName,
      email: newEmail,
      role: newRole,
      auth_user_id: '00000000-0000-0000-0000-000000000000',
    })
    setAddingAdmin(false)
    if (err) { setError(err.message); return }
    setNewEmail(''); setNewName('')
    startTransition(() => router.refresh())
  }

  async function removeAdmin(id: string) {
    if (!confirm('Remove this admin user?')) return
    const supabase = createClient()
    await supabase.from('admin_users').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  async function triggerSync() {
    setSyncStatus('running')
    try {
      const res = await fetch('/api/sheets-webhook', { method: 'POST', body: JSON.stringify({ action: 'manual_sync' }) })
      setSyncStatus(res.ok ? 'done' : 'error')
    } catch {
      setSyncStatus('error')
    }
  }

  return (
    <div className="space-y-10">
      {/* Association details */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Association Details</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3 text-sm">
          <Row label="Name" value="SME Association Labuan" />
          <Row label="Member ID prefix" value="SMEL" />
          <Row label="Live URL" value="smelabuan.pages.dev" />
          <Row label="Email sender" value="noreply@smelabuan.pages.dev" />
        </div>
      </section>

      {/* Membership fees */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Membership Fees</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Size</th>
                <th className="px-4 py-3 text-left">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Life', 'Medium', 'RM 2,000 (one-time)'],
                ['Life', 'Small', 'RM 1,000 (one-time)'],
                ['Life', 'Micro', 'RM 500 (one-time)'],
                ['Ordinary', 'Medium', 'RM 200 / year'],
                ['Ordinary', 'Small', 'RM 100 / year'],
                ['Ordinary', 'Micro', 'RM 50 / year'],
                ['All', 'All', 'RM 50 entry fee (one-time)'],
              ].map(([type, size, fee]) => (
                <tr key={`${type}-${size}`}>
                  <td className="px-4 py-2 text-gray-700">{type}</td>
                  <td className="px-4 py-2 text-gray-700">{size}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Contact your developer to update fee amounts.</p>
      </section>

      {/* Google Sheets sync */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Google Sheets Sync</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-4">
            Supabase is the primary database. Google Sheets is a two-way mirror updated on every admin save, and synced hourly via Apps Script.
          </p>
          <button
            onClick={triggerSync}
            disabled={syncStatus === 'running'}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-60"
            style={{ backgroundColor: '#E05A4E' }}
          >
            {syncStatus === 'running' ? 'Syncing…' : syncStatus === 'done' ? 'Sync complete ✓' : syncStatus === 'error' ? 'Sync failed — retry' : 'Trigger manual sync'}
          </button>
        </div>
      </section>

      {/* Admin users */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Admin Users</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-4">
          {admins.map(a => (
            <div key={a.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{a.full_name}</p>
                <p className="text-xs text-gray-400">{a.email} · <span className="capitalize">{a.role}</span></p>
              </div>
              <button onClick={() => removeAdmin(a.id)} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          ))}
          {!admins.length && <p className="px-4 py-6 text-sm text-gray-400 text-center">No admins</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Add admin user</p>
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
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            onClick={addAdmin}
            disabled={addingAdmin}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: '#E05A4E' }}
          >
            {addingAdmin ? 'Adding…' : 'Add admin'}
          </button>
          <p className="text-xs text-gray-400">The new admin must log in once via OTP to link their auth account.</p>
        </div>
      </section>
    </div>
  )
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A4E]'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}
