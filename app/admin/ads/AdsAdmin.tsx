'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import type { Advertisement } from '@/lib/types'
import { PaginationBar } from '@/components/TablePagination'
import { createClient } from '@/lib/supabase/client'

type AdForm = {
  advertiser_name: string
  headline: string
  description: string
  link_url: string
  bg_color: string
  period_start: string
  period_end: string
  status: 'active' | 'inactive'
}

const empty: AdForm = {
  advertiser_name: '', headline: '', description: '', link_url: '',
  bg_color: '#2d6a4f', period_start: '', period_end: '', status: 'active',
}

const BG_COLORS = [
  { label: 'Teal', value: '#2d6a4f' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Burgundy', value: '#7b1d1d' },
  { label: 'Purple', value: '#4c1d95' },
  { label: 'Slate', value: '#1e293b' },
  { label: 'Amber', value: '#78350f' },
]

export default function AdsAdmin({ ads }: { ads: Advertisement[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Advertisement | null>(null)
  const [form, setForm] = useState<AdForm>(empty)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const fileRef = useRef<HTMLInputElement>(null)

  function openNew() {
    setForm(empty); setEditing(null)
    setImageFile(null); setImagePreview(null)
    setShowForm(true)
  }

  function openEdit(ad: Advertisement) {
    setForm({
      advertiser_name: ad.advertiser_name,
      headline: ad.headline,
      description: ad.description ?? '',
      link_url: ad.link_url ?? '',
      bg_color: ad.bg_color ?? '#2d6a4f',
      period_start: ad.period_start ?? '',
      period_end: ad.period_end ?? '',
      status: ad.status,
    })
    setEditing(ad)
    setImageFile(null)
    setImagePreview(ad.image_url)
    setShowForm(true)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function save() {
    setSaving(true)
    try {
      let image_url = editing?.image_url ?? null

      // Upload image if a new file was selected
      if (imageFile) {
        const supabase = createClient()
        const ext = imageFile.name.split('.').pop()
        const path = `ads/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('ad-images')
          .upload(path, imageFile, { upsert: true })
        if (!uploadError) {
          const { data } = supabase.storage.from('ad-images').getPublicUrl(path)
          image_url = data.publicUrl
        }
      }

      const payload = {
        id: editing?.id,
        advertiser_name: form.advertiser_name,
        headline: form.headline,
        description: form.description || null,
        link_url: form.link_url || null,
        bg_color: form.bg_color,
        image_url,
        period_start: form.period_start || null,
        period_end: form.period_end || null,
        status: form.status,
      }

      const res = await fetch('/api/admin/save-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) { setShowForm(false); window.location.reload() }
    } finally {
      setSaving(false)
    }
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
  const totalPages = Math.ceil(ads.length / pageSize)
  const paged = ads.slice((page - 1) * pageSize, page * pageSize)

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
            {paged.map(ad => (
              <tr key={ad.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {ad.image_url ? (
                      <img src={ad.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: ad.bg_color ?? '#2d6a4f' }} />
                    )}
                    <span className="font-medium text-white">{ad.advertiser_name}</span>
                  </div>
                </td>
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
        <PaginationBar
          page={page} totalPages={totalPages} total={ads.length} pageSize={pageSize}
          onPageChange={p => setPage(p)}
          onPageSizeChange={ps => { setPageSize(ps); setPage(1) }}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-700 my-4" style={{ backgroundColor: '#1f2937' }}>
            <h2 className="text-lg font-bold text-white mb-5">{editing ? 'Edit Banner' : 'New Banner'}</h2>

            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Banner image</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                      <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg">Change</button>
                      <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg">Remove</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="text-xs text-gray-400">Click to upload image</span>
                  </button>
                )}
              </div>

              {/* Background color */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Card background color</label>
                <div className="flex gap-2 flex-wrap">
                  {BG_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm(f => ({ ...f, bg_color: c.value }))}
                      title={c.label}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c.value,
                        borderColor: form.bg_color === c.value ? '#ffffff' : 'transparent',
                        transform: form.bg_color === c.value ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.bg_color}
                    onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))}
                    className="w-8 h-8 rounded-full border-2 border-gray-600 cursor-pointer"
                    title="Custom color"
                  />
                </div>
              </div>

              {([
                ['Advertiser name', 'advertiser_name'],
                ['Headline', 'headline'],
              ] as const).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inp} />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className={inp}
                  placeholder="Details shown when member taps Book now"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Link / Contact URL <span className="text-gray-600">(optional)</span></label>
                <input
                  value={form.link_url}
                  onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://… or tel:+60…"
                  className={inp}
                />
              </div>

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

            <div className="flex gap-2 mt-5">
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
