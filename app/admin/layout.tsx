import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('full_name, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!adminUser) redirect('/home')

  // Count overdue + due this month for sidebar badge
  const service = createServiceClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]
  const [{ count: overdueCount }, { count: dueThisMonthCount }] = await Promise.all([
    service.from('members').select('*', { count: 'exact', head: true })
      .eq('membership_type', 'Ordinary').lt('expiry_date', todayStr).in('status', ['active', 'expired']),
    service.from('members').select('*', { count: 'exact', head: true })
      .eq('membership_type', 'Ordinary').eq('status', 'active').gte('expiry_date', todayStr).lt('expiry_date', nextMonth),
  ])
  const renewalsDue = (overdueCount ?? 0) + (dueThisMonthCount ?? 0)

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#111827' }}>
      <AdminSidebar
        adminName={adminUser.full_name}
        role={adminUser.role}
        renewalsDue={renewalsDue ?? 0}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
