'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Announcement, AnnouncementStatus } from '@/lib/types'

type PublishMode = 'draft' | 'now' | 'schedule'

type AnnouncementForm = {
  title: string
  body: string
  mode: PublishMode
  scheduled_for: string
}

const empty: AnnouncementForm = { title: '', body: '', mode: 'now', scheduled_for: '' }

function statusBadge(a: Announcement) {
  const now = new Date()
  const isLive = a.status === 'published' ||
    (a.status === 'scheduled' && a.scheduled_for != null && new Date(a.scheduled_for) <= now)

  if (isLive) return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-900/50 text-green-300">Live</span>
  if (a.status === 'scheduled') return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-900/50 text-blue-300">Scheduled</span>
  return <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-700 text-gray-400">Draft</span>
}

export default function AnnouncementsAdmin({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<AnnouncementForm>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openNew() { setForm(empty); setEditing(null); setShowForm(true); setError('') }

  function openEdit(a: Announcement) {
    const mode: PublishMode = a.status === 'scheduled' ? 'schedule' : a.status === 'published' ? 'now' : 'draft'
    setForm({
      title: a.title,
      body: a.body,
      mode,
      scheduled_for: a.scheduled_for
        ? format(new Date(a.scheduled_for), "yyyy-MM-dd'T'HH:mm")
        : '',
    })
    setEditing(a)
    setShowForm(true)
    setError('')
  }

  async function save() {
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body are required'); return }
    if (form.mode === 'schedule' && !form.scheduled_for) { setError('Please set a scheduled date and time'); return }

    setSaving(true); setError('')
    const supabase = createClient()

    let status: AnnouncementStatus
    let published_at: string | null = null
    let scheduled_for: string | null = null

    if (form.mode === 'now') {
      status = 'published'
      published_at = new Date().toISOString()
    } else if (form.mode === 'schedule') {
      status = 'scheduled'
      scheduled_for = new Date(form.scheduled_for).toISOString()
    } else {
      status = 'draft'
    }

    const payload = { title: form.title.trim(), body: form.body.trim(), status, published_at, scheduled_for }

    if (editing) {
      await supabase.from('announcements').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('announcements').insert(payload)
    }

    setSaving(false); setShowForm(false)
    startTransition(() => router.refresh())
  }

  async function deleteAnnouncement(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await createClient().from('announcements').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  async function publishNow(a: Announcement) {
    await createClient()
      .from('announcements')
      .update({ status: 'published', published_at: new Date().toISOString(), scheduled_for: null })
      .eq('id', a.id)
    startTransition(() => router.refresh())
  }

  async function unpublish(a: Announcement) {
    await createClient()
      .from('announcements')
      .update({ status: 'draft', published_at: null })
      .eq('id', a.id)
    startTransition(() => router.refresh())
  }

  const now = new Date()

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#E05A4E' }}>
          + New announcement
        </button>
      </div>

      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 text-white text-xs uppercase tracking-wide">
            <tr>
              {['Title', 'Status', 'Published / Scheduled', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {announcements.map(a => {
              const isLive = a.status === 'published' ||
                (a.status === 'scheduled' && a.scheduled_for != null && new Date(a.scheduled_for) <= now)
              return (
                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{a.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{a.body}</p>
                  </td>
                  <td className="px-4 py-3">{statusBadge(a)}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {a.status === 'published' && a.published_at
                      ? format(new Date(a.published_at), 'd MMM yyyy, HH:mm')
                      : a.status === 'scheduled' && a.scheduled_for
                        ? format(new Date(a.scheduled_for), 'd MMM yyyy, HH:mm')
                        : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 justify-end items-center">
                      {!isLive && (
                        <button onClick={() => publishNow(a)} className="text-xs text-green-400 hover:text-green-300 hover:underline">Publish now</button>
                      )}
                      {isLive && (
                        <button onClick={() => unpublish(a)} className="text-xs text-yellow-400 hover:text-yellow-300 hover:underline">Unpublish</button>
                      )}
                      <button onClick={() => openEdit(a)} className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Edit</button>
                      <button onClick={() => deleteAnnouncement(a.id, a.title)} className="text-xs text-red-400 hover:text-red-300 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!announcements.length && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No announcements yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-700" style={{ backgroundColor: '#1f2937' }}>
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
            <div className="space-y-3">
              <Field label="Title">
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title"
                  className={inp}
                />
              </Field>
              <Field label="Body">
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Write your announcement here…"
                  rows={4}
                  className={inp}
                />
              </Field>
              <Field label="Publish">
                <div className="flex gap-2">
                  {(['now', 'schedule', 'draft'] as PublishMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setForm(f => ({ ...f, mode: m }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        form.mode === m
                          ? 'border-[#E05A4E] bg-[#E05A4E]/20 text-white'
                          : 'border-gray-600 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {m === 'now' ? 'Publish now' : m === 'schedule' ? 'Schedule' : 'Save as draft'}
                    </button>
                  ))}
                </div>
              </Field>
              {form.mode === 'schedule' && (
                <Field label="Scheduled date & time">
                  <input
                    type="datetime-local"
                    value={form.scheduled_for}
                    onChange={e => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
                    className={inp}
                  />
                </Field>
              )}
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-gray-600 text-sm text-gray-400">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: '#E05A4E' }}>
                {saving ? 'Saving…' : editing ? 'Save changes' : form.mode === 'draft' ? 'Save draft' : form.mode === 'schedule' ? 'Schedule' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const inp = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E05A4E] bg-gray-800 placeholder-gray-500'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>{children}</div>
}
