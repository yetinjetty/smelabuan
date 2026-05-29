import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { ActivityLog } from '@/lib/types'
import LogExport from './LogExport'

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>
}) {
  const { action, page } = await searchParams
  const supabase = await createClient()
  const pageNum = parseInt(page ?? '1', 10)
  const pageSize = 50
  const from = (pageNum - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('activity_log')
    .select('*, members(full_name, member_id), admin_users(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (action) query = query.eq('action', action)

  const { data: logs, count } = await query.returns<ActivityLog[]>()
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <LogExport />
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {['', 'approved', 'rejected', 'renewed', 'upgraded', 'edited', 'synced'].map(a => (
          <a
            key={a}
            href={a ? `/admin/log?action=${a}` : '/admin/log'}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              action === a || (!a && !action)
                ? 'border-[#E05A4E] bg-[#E05A4E] text-white'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {a || 'All'}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Member</th>
              <th className="px-4 py-3 text-left">Admin</th>
              <th className="px-4 py-3 text-left">Details</th>
              <th className="px-4 py-3 text-left">Payment ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(logs ?? []).map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(log.created_at), 'd MMM yyyy, HH:mm')}
                </td>
                <td className="px-4 py-3">
                  <ActionBadge action={log.action} />
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {log.members ? (
                    <>
                      <p className="font-medium">{log.members.full_name}</p>
                      <p className="text-xs text-gray-400">{log.members.member_id}</p>
                    </>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{log.admin_users?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{log.details ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.payment_ref ?? '—'}</td>
              </tr>
            ))}
            {!logs?.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No activity</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {pageNum} of {totalPages}</span>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <a href={`/admin/log?${action ? `action=${action}&` : ''}page=${pageNum - 1}`}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  Previous
                </a>
              )}
              {pageNum < totalPages && (
                <a href={`/admin/log?${action ? `action=${action}&` : ''}page=${pageNum + 1}`}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    renewed: 'bg-blue-100 text-blue-700',
    upgraded: 'bg-purple-100 text-purple-700',
    edited: 'bg-gray-100 text-gray-600',
    synced: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[action] ?? 'bg-gray-100 text-gray-600'}`}>
      {action}
    </span>
  )
}
