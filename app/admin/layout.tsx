import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar adminName={adminUser.full_name} role={adminUser.role} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
