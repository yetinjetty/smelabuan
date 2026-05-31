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

  // Count renewals due this month for sidebar badge
  const service = createServiceClient()
  const today = new Date()
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]
  const { count: renewalsDue } = await service
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('expiry_date', thisMonth)
    .lt('expiry_date', nextMonth)

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
