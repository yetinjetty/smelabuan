'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Deal } from '@/lib/types'

type DealForm = {
  merchant_name: string
  offer_description: string
  category: string
  discount_value: string
  valid_until: string
  status: 'active' | 'expired'
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
    setForm({
      merchant_name: d.merchant_name,
      offer_description: d.offer_description ?? '',
      category: d.category ?? '',
      discount_value: d.discount_value ?? '',
      valid_until: d.valid_until ?? '',
      status: d.status === 'active' ? 'active' : 'expired',
    })
    setEditing(d)
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      merchant_name: form.merchant_name,
      offer_description: form.offer_description || null,
      category: form.category || null,
      discount_value: form.discount_value || null,
      valid_until: form.valid_until || null,
      status: form.status,
    }
    if (editing) {
      await supabase.from('deals').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('deals').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    startTransition(() => router.refresh())
  }

  async function deleteDeal(id: string) {
    if (!confirm('Delete this deal?')) return
    const supabase = createClient()
    await supabase.from('deals').delete().eq('id', id)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#E05A4E' }}>
          + Add deal
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Merchant</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Discount</th>
              <th className="px-4 py-3 text-left">Valid until</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deals.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{d.merchant_name}</p>
                  {d.offer_description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{d.offer_description}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{d.category ?? '—'}</td>
                <td className="px-4 py-3 font-medium" style={{ color: '#E05A4E' }}>{d.discount_value ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{d.valid_until ? format(new Date(d.valid_until), 'd MMM yyyy') : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(d)} className="text-xs text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => deleteDeal(d.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!deals.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No deals yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editing ? 'Edit Deal' : 'New Deal'}</h2>
            <div className="space-y-3">
              {[
                { label: 'Merchant name', key: 'merchant_name' as const },
                { label: 'Offer description', key: 'offer_description' as const },
                { label: 'Discount value (e.g. 15%)', key: 'discount_value' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inp} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valid until</label>
                <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'expired' }))} className={inp}>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-gray-300 text-sm text-gray-600">Cancel</button>
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

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A4E]'
