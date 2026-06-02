'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Member } from '@/lib/types'
import { PaginationBar } from '@/components/TablePagination'

const COLUMNS = [
  { key: 'business_name',   label: 'Business' },
  { key: 'member_id',       label: 'Member ID' },
  { key: 'membership_type', label: 'Type' },
  { key: 'full_name',       label: 'Name' },
  { key: 'status',          label: 'Status' },
  { key: 'expiry_date',     label: 'Expiry' },
  { key: 'created_at',      label: 'Joined' },
] as const

type SortKey = typeof COLUMNS[number]['key']

export default function MembersTable({
  members, total, page, pageSize, status, q, perPage, sortBy, sortDir,
}: {
  members: Member[]
  total: number
  page: number
  pageSize: number
  status?: string
  q?: string
  perPage?: number
  sortBy?: string
  sortDir?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(q ?? '')
  const [filter, setFilter] = useState(status ?? '')
  const [selected, setSelected] = useState<Member | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Member>>({})
  const [actionError, setActionError] = useState('')
  const [actionInfo, setActionInfo] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [colWidths, setColWidths] = useState<Record<string, number>>({})

  // ── Column resize ────────────────────────────────────────────
  function startResize(e: React.MouseEvent, colKey: string, currentWidth: number) {
    e.preventDefault()
    const startX = e.clientX
    const startW = currentWidth

    function onMove(ev: MouseEvent) {
      const w = Math.max(60, startW + ev.clientX - startX)
      setColWidths(prev => ({ ...prev, [colKey]: w }))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    const t = setTimeout(() => applyFilters(search, filter), 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  function openMember(m: Member) {
    setSelected(m)
    setEditing(false)
    setActionError('')
    setActionInfo('')
  }

  function startEditing() {
    setEditForm({ ...selected! })
    setEditing(true)
    setActionError('')
    setActionInfo('')
  }

  function set<K extends keyof Member>(key: K) {
    return (val: string) => setEditForm(f => ({ ...f, [key]: val === '' ? null : val as Member[K] }))
  }

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    params.set('page', String(page))
    if (perPage) params.set('perPage', String(perPage))
    if (sortBy) params.set('sortBy', sortBy)
    if (sortDir) params.set('sortDir', sortDir)
    Object.entries(overrides).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k))
    return params.toString()
  }

  function applyFilters(newSearch: string, newFilter: string) {
    const params = new URLSearchParams()
    if (newSearch) params.set('q', newSearch)
    if (newFilter) params.set('status', newFilter)
    params.set('page', '1')
    if (perPage) params.set('perPage', String(perPage))
    if (sortBy) params.set('sortBy', sortBy)
    if (sortDir) params.set('sortDir', sortDir)
    router.push(`/admin/members?${params}`)
  }

  function handleSort(col: SortKey) {
    const newDir = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc'
    router.push(`/admin/members?${buildParams({ sortBy: col, sortDir: newDir, page: '1' })}`)
  }

  async function callApi(action: string, body: object) {
    setActionError('')
    setActionInfo('')
    setLoadingAction(action)
    try {
      const res = await fetch(`/api/admin/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      let json: Record<string, unknown> = {}
      try { json = await res.json() } catch { /* non-JSON body */ }
      if (!res.ok) {
        setActionError((json.error as string) ?? `${action} failed (HTTP ${res.status})`)
        return { ok: false, json }
      }
      return { ok: true, json }
    } catch (err) {
      setActionError(`Request failed: ${err instanceof Error ? err.message : 'unknown error'}`)
      return { ok: false, json: {} }
    } finally {
      setLoadingAction(null)
    }
  }

  async function approveMember(member: Member) {
    const result = await callApi('approve', { memberId: member.id, membershipType: member.membership_type })
    if (result.ok) {
      const json = result.json as { emailSent?: boolean; emailError?: string }
      if (json.emailSent === false && json.emailError) {
        setActionInfo(`Member approved ✓ — Email not sent: ${json.emailError}`)
      }
      setSelected(null)
      setTimeout(() => window.location.reload(), json.emailSent === false ? 3000 : 0)
    }
  }

  async function rejectMember(member: Member) {
    const result = await callApi('reject', { memberId: member.id })
    if (result.ok) { setSelected(null); window.location.reload() }
  }

  async function setStatus(member: Member, newStatus: string) {
    const result = await callApi('set-status', { memberId: member.id, status: newStatus })
    if (result.ok) { setSelected(null); window.location.reload() }
  }

  async function deleteMember(member: Member) {
    if (!confirm(`Delete ${member.full_name}? This cannot be undone.`)) return
    const result = await callApi('delete-member', { memberId: member.id })
    if (result.ok) { setSelected(null); window.location.reload() }
  }

  async function upgradeMember(member: Member) {
    if (!confirm(`Upgrade ${member.full_name} from Ordinary to Life Member? This will assign a new Life member ID and remove the expiry date.`)) return
    const result = await callApi('upgrade-member', { memberId: member.id })
    if (result.ok) {
      setActionInfo(`${member.full_name} has been upgraded to Life Member (${result.json.newMemberId}).`)
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  async function saveEdits() {
    if (!selected) return
    const result = await callApi('edit-member', { memberId: selected.id, ...editForm })
    if (result.ok) { setEditing(false); window.location.reload() }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      {/* Title + search/filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white shrink-0">Members</h1>
        <div className="flex items-center gap-2 flex-1 flex-wrap justify-end">
          <input
            type="search"
            placeholder="Search name, email, ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
className="border border-gray-600 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#E05A4E] text-white placeholder-gray-500"
            style={{ backgroundColor: '#1f2937' }}
          />
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); applyFilters(search, e.target.value) }}
            className="border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E05A4E] text-white"
            style={{ backgroundColor: '#1f2937' }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <button
            onClick={() => applyFilters(search, filter)}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium"
            style={{ backgroundColor: '#E05A4E' }}
          >
            Search
          </button>
          <span className="text-sm text-gray-500 whitespace-nowrap">{total} result{total !== 1 ? 's' : ''}</span>
          <a
            href="/api/admin/export-members"
            download="SME member list.csv"
            className="px-4 py-2 text-sm rounded-lg text-white font-medium flex items-center gap-1.5 whitespace-nowrap"
            style={{ backgroundColor: '#374151' }}
          >
            ↓ Export CSV
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: Object.keys(colWidths).length ? 'fixed' : 'auto' }}>
            <thead className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                {COLUMNS.map(col => {
                  const w = colWidths[col.key]
                  return (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left relative select-none"
                      style={w ? { width: w, minWidth: w } : {}}
                    >
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-white transition-colors group"
                      >
                        {col.label}
                        <SortIcon col={col.key} sortBy={sortBy} sortDir={sortDir} />
                      </button>
                      {/* Resize divider — always visible line, turns red on hover/drag */}
                      <span
                        onMouseDown={e => startResize(e, col.key, w ?? (e.currentTarget.closest('th') as HTMLTableCellElement)?.offsetWidth ?? 120)}
                        className="absolute right-0 top-1 bottom-1 w-px cursor-col-resize group/resize"
                        style={{ backgroundColor: '#374151' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E05A4E')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#374151')}
                        title="Drag to resize column"
                      />
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50" style={{ color: '#ffffff' }}>
              {members.map(m => (
                <tr
                  key={m.id}
                  onClick={() => openMember(m)}
                  className="hover:bg-white/5 cursor-pointer transition-colors [&>td:not(:last-child)]:border-r [&>td:not(:last-child)]:border-gray-700/50"
                >
                  <td className="px-4 py-3">
                    <p className="text-gray-300 truncate max-w-[160px]">{m.business_name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{m.business_sector ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-white">{m.member_id || '—'}</td>
                  <td className="px-4 py-3 text-white">{m.membership_type ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{m.full_name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-white">
                    {m.expiry_date ? format(new Date(m.expiry_date), 'd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {format(new Date(m.created_at), 'd MMM yyyy')}
                  </td>
                </tr>
              ))}
              {!members.length && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No members found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={p => router.push(`/admin/members?${buildParams({ page: String(p) })}`)}
          onPageSizeChange={ps => router.push(`/admin/members?${buildParams({ page: '1', perPage: String(ps) })}`)}
        />
      </div>

      {/* Member drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md h-full overflow-y-auto p-6 shadow-2xl border-l border-gray-700"
            style={{ backgroundColor: '#111827' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'Edit Member' : 'Member Details'}</h2>
              <div className="flex items-center gap-2">
                {!editing && (
                  <button
                    onClick={startEditing}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl leading-none ml-1">✕</button>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4 text-sm">
                <Section label="Membership" />
                <EF label="Member ID"       value={editForm.member_id ?? ''}       onChange={set('member_id')} />
                <ESelect label="Membership type" value={editForm.membership_type ?? ''} onChange={set('membership_type')}
                  options={[{ value: '', label: '— none —' }, { value: 'Life', label: 'Life' }, { value: 'Ordinary', label: 'Ordinary' }]} />
                <ESelect label="Status" value={editForm.status ?? 'pending'} onChange={set('status')}
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'active', label: 'Active' },
                    { value: 'expired', label: 'Expired' },
                    { value: 'inactive', label: 'Inactive' },
                  ]} />
                <EF label="Member since"   value={editForm.member_since ?? ''}    onChange={set('member_since')} type="date" />
                <EF label="Expiry date"    value={editForm.expiry_date ?? ''}     onChange={set('expiry_date')}  type="date" />
                <EF label="Payment ref"    value={editForm.payment_ref ?? ''}     onChange={set('payment_ref')} />

                <Section label="Personal" />
                <EF label="Full name"  value={editForm.full_name ?? ''} onChange={set('full_name')} />
                <EF label="IC number"  value={editForm.ic_number ?? ''} onChange={set('ic_number')} />
                <EF label="Email"      value={editForm.email ?? ''}     onChange={set('email')} type="email" />
                <EF label="Phone"      value={editForm.phone ?? ''}     onChange={set('phone')} type="tel" />

                <Section label="Business" />
                <EF label="Business name"    value={editForm.business_name ?? ''}    onChange={set('business_name')} />
                <EF label="SSM reg. no."     value={editForm.ssm_reg_no ?? ''}       onChange={set('ssm_reg_no')} />
                <EF label="Sector category"  value={editForm.sector_category ?? ''}  onChange={set('sector_category')} />
                <EF label="Business sector"  value={editForm.business_sector ?? ''}  onChange={set('business_sector')} />
                <ESelect label="Business size" value={editForm.business_size ?? ''} onChange={set('business_size')}
                  options={[
                    { value: '', label: '— none —' },
                    { value: 'Micro', label: 'Micro' },
                    { value: 'Small', label: 'Small' },
                    { value: 'Medium', label: 'Medium' },
                  ]} />
                <EArea label="Business address" value={editForm.business_address ?? ''} onChange={set('business_address')} />

                <Section label="Representative" />
                <EF label="Rep. name"  value={editForm.rep_name ?? ''}  onChange={set('rep_name')} />
                <EF label="Rep. IC"    value={editForm.rep_ic ?? ''}    onChange={set('rep_ic')} />
                <EF label="Rep. phone" value={editForm.rep_phone ?? ''} onChange={set('rep_phone')} type="tel" />
              </div>
            ) : (
              <dl className="space-y-4 text-sm">
                <Section label="Membership" />
                {([
                  ['Member ID',      selected.member_id || '—'],
                  ['Membership type', selected.membership_type ?? '—'],
                  ['Status',         selected.status],
                  ['Member since',   selected.member_since ? format(new Date(selected.member_since), 'd MMM yyyy') : '—'],
                  ['Expiry date',    selected.expiry_date ? format(new Date(selected.expiry_date), 'd MMM yyyy') : '—'],
                  ['Payment ref',    selected.payment_ref ?? '—'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-gray-500 shrink-0">{k}</dt>
                    <dd className="text-white text-right">{v}</dd>
                  </div>
                ))}

                <Section label="Personal" />
                {([
                  ['Full name', selected.full_name],
                  ['IC number', selected.ic_number ?? '—'],
                  ['Email',     selected.email],
                  ['Phone',     selected.phone ?? '—'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-gray-500 shrink-0">{k}</dt>
                    <dd className="text-white text-right break-all">{v}</dd>
                  </div>
                ))}

                <Section label="Business" />
                {([
                  ['Business name',   selected.business_name ?? '—'],
                  ['SSM reg. no.',    selected.ssm_reg_no ?? '—'],
                  ['Sector category', selected.sector_category ?? '—'],
                  ['Business sector', selected.business_sector ?? '—'],
                  ['Business size',   selected.business_size ?? '—'],
                  ['Business address', selected.business_address ?? '—'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-gray-500 shrink-0">{k}</dt>
                    <dd className="text-white text-right">{v}</dd>
                  </div>
                ))}

                {selected.rep_name && (
                  <>
                    <Section label="Representative" />
                    {([
                      ['Name',      selected.rep_name],
                      ['IC number', selected.rep_ic ?? '—'],
                      ['Phone',     selected.rep_phone ?? '—'],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="text-gray-500 shrink-0">{k}</dt>
                        <dd className="text-white text-right">{v}</dd>
                      </div>
                    ))}
                  </>
                )}
              </dl>
            )}

            {actionError && <p className="text-red-400 text-sm mt-4">{actionError}</p>}
            {actionInfo  && <p className="text-amber-400 text-sm mt-4">{actionInfo}</p>}

            <div className="mt-8 space-y-3">
              {editing ? (
                <>
                  <button
                    disabled={!!loadingAction}
                    onClick={saveEdits}
                    className="w-full py-2.5 rounded-xl text-white font-medium text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    {loadingAction === 'edit-member' ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="w-full py-2.5 rounded-xl font-medium text-sm border border-gray-600 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {selected.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        disabled={!!loadingAction}
                        onClick={() => approveMember(selected)}
                        className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm bg-green-600 hover:bg-green-700 disabled:opacity-60"
                      >
                        {loadingAction === 'approve' ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        disabled={!!loadingAction}
                        onClick={() => rejectMember(selected)}
                        className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm bg-red-500 hover:bg-red-600 disabled:opacity-60"
                      >
                        {loadingAction === 'reject' ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                  )}

                  {selected.status === 'active' && selected.membership_type === 'Ordinary' && (
                    <button
                      disabled={!!loadingAction}
                      onClick={() => upgradeMember(selected)}
                      className="w-full py-2.5 rounded-xl font-medium text-sm text-white disabled:opacity-60 transition-colors"
                      style={{ backgroundColor: '#7c3aed' }}
                    >
                      {loadingAction === 'upgrade-member' ? 'Upgrading…' : '⬆ Upgrade to Life Member'}
                    </button>
                  )}

                  {selected.status === 'active' && (
                    <button
                      disabled={!!loadingAction}
                      onClick={() => setStatus(selected, 'inactive')}
                      className="w-full py-2.5 rounded-xl font-medium text-sm border border-orange-600 text-orange-400 hover:bg-orange-900/20 disabled:opacity-60"
                    >
                      {loadingAction === 'set-status' ? 'Deactivating…' : 'Deactivate membership'}
                    </button>
                  )}

                  {selected.status === 'inactive' && (
                    <button
                      disabled={!!loadingAction}
                      onClick={() => setStatus(selected, 'active')}
                      className="w-full py-2.5 rounded-xl text-white font-medium text-sm bg-green-600 hover:bg-green-700 disabled:opacity-60"
                    >
                      {loadingAction === 'set-status' ? 'Reactivating…' : 'Reactivate membership'}
                    </button>
                  )}

                  <button
                    disabled={!!loadingAction}
                    onClick={() => deleteMember(selected)}
                    className="w-full py-2.5 rounded-xl font-medium text-sm border border-red-800 text-red-400 hover:bg-red-900/20 disabled:opacity-60"
                  >
                    {loadingAction === 'delete-member' ? 'Deleting…' : 'Delete member record'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'   ? 'bg-green-900/60 text-green-300' :
    status === 'expired'  ? 'bg-red-900/60 text-red-300' :
    status === 'inactive' ? 'bg-gray-700 text-gray-400' :
    'bg-yellow-900/60 text-yellow-300'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cls}`}>{status}</span>
}

function SortIcon({ col, sortBy, sortDir }: { col: string; sortBy?: string; sortDir?: string }) {
  if (sortBy !== col) return <span className="text-gray-600 text-xs">↕</span>
  return <span className="text-white text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

function Section({ label }: { label: string }) {
  return <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 pb-1 border-b border-gray-700 pt-2">{label}</div>
}

const inputCls = "w-full px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"

function EF({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
    </div>
  )
}

function ESelect({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function EArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className={`${inputCls} resize-none`} />
    </div>
  )
}
