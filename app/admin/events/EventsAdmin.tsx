'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'
import { PaginationBar } from '@/components/TablePagination'

type EventForm = {
  title: string; venue: string; event_date: string
  access_type: 'open' | 'members_only'; description: string
}
const empty: EventForm = { title: '', venue: '', event_date: '', access_type: 'open', description: '' }

export default function EventsAdmin({ events }: { events: Event[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [form, setForm] = useState<EventForm>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  function openNew() { setForm(empty); setEditing(null); setShowForm(true) }
  function openEdit(e: Event) {
    setForm({ title: e.title, venue: e.venue ?? '', event_date: e.event_date, access_type: e.access_type, description: e.description ?? '' })
    setEditing(e); setShowForm(true)
  }

  async function save() {
    if (!form.title || !form.event_date) { setError('Title and date are required'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    if (editing) {
      await supabase.from('events').update({ ...form, venue: form.venue || null, description: form.description || null }).eq('id', editing.id)
    } else {
      await supabase.from('events').insert({ ...form, venue: form.venue || null, description: form.description || null })
    }
    setSaving(false); setShowForm(false)
    startTransition(() => router.refresh())
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return
    await createClient().from('events').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  const totalPages = Math.ceil(events.length / pageSize)
  const paged = events.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#E05A4E' }}>
          + Add event
        </button>
      </div>

      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 text-white text-xs uppercase tracking-wide">
            <tr>
              {['Title', 'Date', 'Venue', 'Access', 'Registrations', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50" style={{ color: '#ffffff' }}>
            {paged.map(e => (
              <tr key={e.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{e.title}</td>
                <td className="px-4 py-3 text-white">{format(new Date(e.event_date), 'd MMM yyyy')}</td>
                <td className="px-4 py-3 text-white">{e.venue ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    e.access_type === 'members_only'
                      ? 'bg-purple-900/60 text-purple-300'
                      : 'bg-gray-700 text-white'
                  }`}>
                    {e.access_type === 'members_only' ? 'Members only' : 'Open'}
                  </span>
                </td>
                <td className="px-4 py-3 text-white">{e.registered_count}</td>
                <td className="px-4 py-3 flex gap-3 justify-end">
                  <button onClick={() => openEdit(e)} className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Edit</button>
                  <button onClick={() => deleteEvent(e.id)} className="text-xs text-red-400 hover:text-red-300 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!events.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No events yet</td></tr>
            )}
          </tbody>
        </table>
        <PaginationBar
          page={page} totalPages={totalPages} total={events.length} pageSize={pageSize}
          onPageChange={p => setPage(p)}
          onPageSizeChange={ps => { setPageSize(ps); setPage(1) }}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-700" style={{ backgroundColor: '#1f2937' }}>
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Event' : 'New Event'}</h2>
            <div className="space-y-3">
              <Field label="Title"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} /></Field>
              <Field label="Date"><input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} className={inp} /></Field>
              <Field label="Venue"><input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className={inp} /></Field>
              <Field label="Access">
                <select value={form.access_type} onChange={e => setForm(f => ({ ...f, access_type: e.target.value as 'open' | 'members_only' }))} className={inp}>
                  <option value="open">Open to public</option>
                  <option value="members_only">Members only</option>
                </select>
              </Field>
              <Field label="Description"><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={inp} /></Field>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-gray-600 text-sm text-gray-400">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: '#E05A4E' }}>
                {saving ? 'Saving…' : 'Save'}
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
