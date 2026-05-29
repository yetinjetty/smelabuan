import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { ActivityLog } from '@/lib/types'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const today = new Date()
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]

  const [
    { count: totalMembers },
    { count: pendingCount },
    { count: activeCount },
    { count: expiredCount },
    { count: renewalsDue },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('members').select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('expiry_date', thisMonth)
      .lt('expiry_date', nextMonth),
    supabase.from('activity_log')
      .select('*, members(full_name, member_id), admin_users(full_name)')
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<ActivityLog[]>(),
  ])

  const stats = [
    { label: 'Total Members', value: totalMembers ?? 0, color: 'text-gray-900' },
    { label: 'Active', value: activeCount ?? 0, color: 'text-green-600' },
    { label: 'Pending', value: pendingCount ?? 0, color: 'text-yellow-600' },
    { label: 'Expired', value: expiredCount ?? 0, color: 'text-red-600' },
    { label: 'Renewals Due', value: renewalsDue ?? 0, color: 'text-orange-600' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending applications */}
      {(pendingCount ?? 0) > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-medium text-yellow-800">
            {pendingCount} pending application{(pendingCount ?? 0) > 1 ? 's' : ''} awaiting review.{' '}
            <a href="/admin/members?status=pending" className="underline">Review now →</a>
          </p>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(recentActivity ?? []).map(log => (
            <div key={log.id} className="px-6 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  <span className="font-medium capitalize">{log.action}</span>
                  {log.members && ` — ${log.members.full_name} (${log.members.member_id})`}
                </p>
                {log.details && <p className="text-xs text-gray-500 truncate">{log.details}</p>}
              </div>
              <p className="flex-none text-xs text-gray-400">
                {format(new Date(log.created_at), 'd MMM, HH:mm')}
              </p>
            </div>
          ))}
          {!recentActivity?.length && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No activity yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
