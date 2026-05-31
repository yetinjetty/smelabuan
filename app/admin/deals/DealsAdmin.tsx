'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Deal } from '@/lib/types'

type DealForm = {
  merchant_name: string; offer_description: string; category: string
  discount_value: string; valid_until: string; status: 'active' | 'expired'
}
const empty: DealForm = { merchant_name: '', offer_description: '', category: '', discount_value: '', valid_until: '', status: 'active' }
const CATEGORIES = ['F&B', 'Business', 'Health', 'Travel', 'Retail', 'Other']

export default function DealsAdmin({ deals }: { deals: Deal[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [form, setForm] = useState<DealForm>(empty)
  const [saving, setSaving] = useState(false)

  function openNew() { setForm(empty); setEditing(null); setShowForm(true) }
  function openEdit(d: Deal) {
    setForm({ merchant_name: d.merchant_name, offer_description: d.offer_description ?? '', category: d.category ?? '', discount_value: d.discount_value ?? '', valid_until: d.valid_until ?? '', status: d.status === 'active' ? 'active' : 'expired' })
    setEditing(d); setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const payload = { merchant_name: form.merchant_name, offer_description: form.offer_description || null, category: form.category || null, discount_value: form.discount_value || null, valid_until: form.valid_until || null, status: form.status }
    if (editing) { await supabase.from('deals').update(payload).eq('id', editing.id) }
    else { await supabase.from('deals').insert(payload) }
    setSaving(false); setShowForm(false)
    startTransition(() => router.refresh())
  }

  async function deleteDeal(id: string) {
    if (!confirm('Delete this deal?')) return
    await createClient().from('deals').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#E05A4E' }}>+ Add deal</button>
      </div>

      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              {['Merchant', 'Category', 'Discount', 'Valid until', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {deals.map(d => (
              <tr key={d.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{d.merchant_name}</p>
                  {d.offer_description && <p className="text-xs text-gray-500 truncate max-w-[200px]">{d.offer_description}</p>}
                </td>
                <td className="px-4 py-3 text-gray-300">{d.category ?? '—'}</td>
                <td className="px-4 py-3 font-medium" style={{ color: '#E05A4E' }}>{d.discount_value ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300">{d.valid_until ? format(new Date(d.valid_until), 'd MMM yyyy') : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.status === 'active' ? 'bg-green-900/60 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3 justify-end">
                  <button onClick={() => openEdit(d)} className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Edit</button>
                  <button onClick={() => deleteDeal(d.id)} className="text-xs text-red-400 hover:text-red-300 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!deals.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No deals yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-700" style={{ backgroundColor: '#1f2937' }}>
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Deal' : 'New Deal'}</h2>
            <div className="space-y-3">
              {([['Merchant name', 'merchant_name'], ['Offer description', 'offer_description'], ['Discount value (e.g. 15%)', 'discount_value']] as const).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inp} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Valid until</label>
                <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'expired' }))} className={inp}>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
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
