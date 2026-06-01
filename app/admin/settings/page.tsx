import { createClient, createServiceClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'
import type { AdminUser } from '@/lib/types'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient()
  const { data: admins } = await service
    .from('admin_users')
    .select('*')
    .order('created_at')
    .returns<AdminUser[]>()

  // Get current admin's id and role to prevent self-demotion and restrict editor actions in UI
  const { data: currentAdmin } = await service
    .from('admin_users')
    .select('id, role')
    .eq('auth_user_id', user?.id ?? '')
    .single()

  return (
    <div className="p-8 max-w-2xl min-h-screen" style={{ backgroundColor: '#111827' }}>
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#ffffff' }}>Settings</h1>
      <SettingsClient admins={admins ?? []} currentAdminId={currentAdmin?.id ?? ''} currentAdminRole={currentAdmin?.role ?? 'editor'} />
    </div>
  )
}


