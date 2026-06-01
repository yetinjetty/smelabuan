import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { ActivityLog } from '@/lib/types'
import LogExport from './LogExport'
import LogPaginationBar from './LogPaginationBar'

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string; perPage?: string }>
}) {
  const { action, page, perPage } = await searchParams
  const service = createServiceClient()
  const pageNum = parseInt(page ?? '1', 10)
  const pageSize = [10, 20, 50].includes(parseInt(perPage ?? '', 10)) ? parseInt(perPage!, 10) : 10
  const from = (pageNum - 1) * pageSize
  const to = from + pageSize - 1

  let query = service
    .from('activity_log')
    .select('*, members(full_name, member_id), admin_users(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (action) query = query.eq('action', action)

  const { data: logs, count } = await query.returns<ActivityLog[]>()
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const filters = ['', 'approved', 'rejected', 'renewed', 'upgraded', 'edited', 'synced']

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#111827' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Activity Log</h1>
        <LogExport />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map(a => {
          const label = a ? a.charAt(0).toUpperCase() + a.slice(1) : 'All'
          const active = action === a || (!a && !action)
          return (
            <a
              key={a}
              href={a ? `/admin/log?action=${a}` : '/admin/log'}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'border-[#E05A4E] bg-[#E05A4E] text-white'
                  : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
            </a>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#1f2937' }}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700">
            <tr>
              {['Time', 'Action', 'Member', 'Admin', 'Details', 'Payment Ref'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50" style={{ color: '#ffffff' }}>
            {(logs ?? []).map(log => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(log.created_at), 'd MMM yyyy, HH:mm')}
                </td>
                <td className="px-4 py-3">
                  <ActionBadge action={log.action} />
                </td>
                <td className="px-4 py-3">
                  {log.members ? (
                    <>
                      <p className="font-medium text-white">{log.members.full_name}</p>
                      <p className="text-xs text-gray-400">{log.members.member_id}</p>
                    </>
                  ) : <span className="text-gray-600">â€”</span>}
                </td>
                <td className="px-4 py-3 text-gray-300">{log.admin_users?.full_name ?? 'â€”'}</td>
                <td className="px-4 py-3 text-gray-400 max-w-[220px] truncate">{log.details ?? 'â€”'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.payment_ref ?? 'â€”'}</td>
              </tr>
            ))}
            {!logs?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No activity found</td>
              </tr>
            )}
          </tbody>
        </table>

        <LogPaginationBar
          page={pageNum}
          totalPages={totalPages}
          total={count ?? 0}
          pageSize={pageSize}
          action={action}
        />
      </div>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    approved: 'bg-green-900/60 text-green-300',
    rejected: 'bg-red-900/60 text-red-300',
    renewed:  'bg-blue-900/60 text-blue-300',
    upgraded: 'bg-purple-900/60 text-purple-300',
    edited:   'bg-gray-700 text-gray-300',
    synced:   'bg-yellow-900/60 text-yellow-300',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[action] ?? 'bg-gray-700 text-gray-300'}`}>
      {action.charAt(0).toUpperCase() + action.slice(1)}
    </span>
  )
}

