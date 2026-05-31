import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { ActivityLog, Member, Event } from '@/lib/types'
import Link from 'next/link'
import DashboardApproveReject from './DashboardApproveReject'

export default async function AdminDashboard() {
  const service = createServiceClient()

  const today = new Date()
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const [
    { count: totalMembers },
    { count: lifeCount },
    { count: ordinaryCount },
    { count: pendingCount },
    { data: pendingMembers },
    { data: upcomingEvents },
    { data: recentActivity },
  ] = await Promise.all([
    service.from('members').select('*', { count: 'exact', head: true }).in('status', ['active', 'expired']),
    service.from('members').select('*', { count: 'exact', head: true }).eq('membership_type', 'Life').eq('status', 'active'),
    service.from('members').select('*', { count: 'exact', head: true }).eq('membership_type', 'Ordinary').eq('status', 'active'),
    service.from('members').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('members')
      .select('id, full_name, business_name, membership_type, business_size')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5)
      .returns<Pick<Member, 'id' | 'full_name' | 'business_name' | 'membership_type' | 'business_size'>[]>(),
    service.from('events')
      .select('*')
      .gte('event_date', today.toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(4)
      .returns<Event[]>(),
    service.from('activity_log')
      .select('*, members(full_name, member_id), admin_users(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(8)
      .returns<ActivityLog[]>(),
  ])

  const total = totalMembers ?? 0
  const life = lifeCount ?? 0
  const ordinary = ordinaryCount ?? 0
  const pending = pendingCount ?? 0
  const lifePercent = total > 0 ? Math.round((life / total) * 100) : 0
  const ordinaryPercent = total > 0 ? Math.round((ordinary / total) * 100) : 0

  const actionColors: Record<string, string> = {
    approved: 'bg-green-900/60 text-green-300',
    rejected: 'bg-red-900/60 text-red-300',
    renewed: 'bg-blue-900/60 text-blue-300',
    upgraded: 'bg-purple-900/60 text-purple-300',
    edited: 'bg-gray-700 text-gray-300',
    synced: 'bg-gray-700 text-gray-300',
  }

  return (
    <div className="p-8 text-white min-h-screen" style={{ backgroundColor: '#111827' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-3">
          <a
            href="/api/admin/export-members"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            ↓ Export
          </a>
          <Link
            href="/admin/members"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: '#E05A4E' }}
          >
            + Add member
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total members', value: total, sub: `+${pending} pending` },
          { label: 'Life members', value: life, sub: `${lifePercent}%` },
          { label: 'Ordinary', value: ordinary, sub: `${ordinaryPercent}%` },
          {
            label: 'Pending apps',
            value: pending,
            sub: pending > 0 ? 'To review' : 'None',
            highlight: pending > 0,
          },
        ].map(({ label, value, sub, highlight }) => (
          <div
            key={label}
            className="rounded-xl p-5 border border-gray-700"
            style={{ backgroundColor: '#1f2937' }}
          >
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
            <p className={`text-4xl font-bold ${highlight ? 'text-[#E05A4E]' : 'text-white'}`}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-5 gap-6 mb-6">

        {/* Pending applications */}
        <div className="col-span-3 rounded-xl border border-gray-700" style={{ backgroundColor: '#1f2937' }}>
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-white">Pending applications</h2>
            {pending > 0 && (
              <span className="text-xs font-bold bg-[#E05A4E] text-white px-2.5 py-0.5 rounded-full">
                {pending} new
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-700">
            {(pendingMembers ?? []).map(m => (
              <div key={m.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {[m.business_name, m.membership_type, m.business_size].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <DashboardApproveReject
                  memberId={m.id}
                  membershipType={m.membership_type ?? 'Ordinary'}
                  memberName={m.full_name}
                />
              </div>
            ))}
            {!pendingMembers?.length && (
              <p className="px-5 py-8 text-sm text-gray-500 text-center">No pending applications</p>
            )}
          </div>
          {(pending ?? 0) > 5 && (
            <div className="px-5 py-3 border-t border-gray-700">
              <Link href="/admin/members?status=pending" className="text-xs text-[#E05A4E] hover:underline">
                View all {pending} applications →
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div className="col-span-2 rounded-xl border border-gray-700" style={{ backgroundColor: '#1f2937' }}>
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-white">Upcoming events</h2>
            <Link href="/admin/events" className="text-xs text-[#E05A4E] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-700">
            {(upcomingEvents ?? []).map(event => {
              const d = new Date(event.event_date)
              return (
                <div key={event.id} className="px-5 py-4 flex items-start gap-3">
                  <div
                    className="shrink-0 w-11 h-11 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: '#E05A4E' }}
                  >
                    <span className="text-lg leading-none">{d.getDate()}</span>
                    <span className="uppercase text-[9px] leading-none mt-0.5">
                      {format(d, 'MMM')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {event.venue && `${event.venue} · `}{event.registered_count} registered
                    </p>
                  </div>
                </div>
              )
            })}
            {!upcomingEvents?.length && (
              <p className="px-5 py-8 text-sm text-gray-500 text-center">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">Recent activity</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              {['Member ID', 'Member', 'Action', 'Date', 'By'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50" style={{ color: '#ffffff' }}>
            {(recentActivity ?? []).map(log => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-gray-400">
                  {log.members?.member_id ?? '—'}
                </td>
                <td className="px-5 py-3 text-gray-300 max-w-[180px] truncate">
                  {log.members?.full_name ?? '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${actionColors[log.action] ?? 'bg-gray-700 text-gray-300'}`}>
                    {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {format(new Date(log.created_at), 'd MMM yyyy')}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs capitalize">
                  {log.admin_users?.role === 'president' ? 'President' : log.admin_users?.full_name ?? '—'}
                </td>
              </tr>
            ))}
            {!recentActivity?.length && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">No activity yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

