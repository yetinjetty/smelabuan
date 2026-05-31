'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Advertisement } from '@/lib/types'

type AdForm = {
  advertiser_name: string; headline: string
  period_start: string; period_end: string; status: 'active' | 'inactive'
}
const empty: AdForm = { advertiser_name: '', headline: '', period_start: '', period_end: '', status: 'active' }

export default function AdsAdmin({ ads }: { ads: Advertisement[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Advertisement | null>(null)
  const [form, setForm] = useState<AdForm>(empty)
  const [saving, setSaving] = useState(false)

  function openNew() { setForm(empty); setEditing(null); setShowForm(true) }
  function openEdit(ad: Advertisement) {
    setForm({ advertiser_name: ad.advertiser_name, headline: ad.headline, period_start: ad.period_start ?? '', period_end: ad.period_end ?? '', status: ad.status })
    setEditing(ad); setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = {
      id: editing?.id,
      advertiser_name: form.advertiser_name,
      headline: form.headline,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      status: form.status,
    }
    const res = await fetch('/api/admin/save-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) { setShowForm(false); window.location.reload() }
  }

  async function deleteAd(id: string) {
    if (!confirm('Delete this ad?')) return
    await fetch('/api/admin/delete-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    window.location.reload()
  }

  const activeCount = ads.filter(a => a.status === 'active').length

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">{activeCount} active banner{activeCount !== 1 ? 's' : ''}</p>
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#E05A4E' }}>+ Add banner</button>
      </div>

      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 text-gray-300 text-xs uppercase tracking-wide">
            <tr>
              {['Advertiser', 'Headline', 'Period', 'Clicks', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50" style={{ color: '#ffffff' }}>
            {ads.map(ad => (
              <tr key={ad.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{ad.advertiser_name}</td>
                <td className="px-4 py-3 text-white max-w-[200px] truncate">{ad.headline}</td>
                <td className="px-4 py-3 text-white text-xs whitespace-nowrap">
                  {ad.period_start ? format(new Date(ad.period_start), 'd MMM') : '—'}
                  {' – '}
                  {ad.period_end ? format(new Date(ad.period_end), 'd MMM yyyy') : '—'}
                </td>
                <td className="px-4 py-3 text-white">{ad.click_count}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ad.status === 'active' ? 'bg-green-900/60 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {ad.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3 justify-end">
                  <button onClick={() => openEdit(ad)} className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Edit</button>
                  <button onClick={() => deleteAd(ad.id)} className="text-xs text-red-400 hover:text-red-300 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!ads.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No ads yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-700" style={{ backgroundColor: '#1f2937' }}>
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Banner' : 'New Banner'}</h2>
            <div className="space-y-3">
              {([['Advertiser name', 'advertiser_name'], ['Headline', 'headline']] as const).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inp} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Start date</label>
                  <input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">End date</label>
                  <input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))} className={inp}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-gray-600 text-sm text-gray-400">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: '#E05A4E' }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const inp = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E05A4E] bg-gray-800 placeholder-gray-500'
