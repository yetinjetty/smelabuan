import { createClient, createServiceClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'
import type { AdminUser, Member } from '@/lib/types'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient()
  const [{ data: admins }, { data: members }, { data: currentAdmin }] = await Promise.all([
    service.from('admin_users').select('*').order('created_at').returns<AdminUser[]>(),
    service.from('members').select('id, full_name, email, business_name, membership_type, status').in('status', ['active', 'expired']).order('full_name').returns<Pick<Member, 'id' | 'full_name' | 'email' | 'business_name' | 'membership_type' | 'status'>[]>(),
    service.from('admin_users').select('id, role').eq('auth_user_id', user?.id ?? '').single(),
  ])

  // Filter out members who are already admins
  const adminEmails = new Set((admins ?? []).map(a => a.email))
  const eligibleMembers = (members ?? []).filter(m => !adminEmails.has(m.email))

  return (
    <div className="p-8 max-w-2xl min-h-screen" style={{ backgroundColor: '#111827' }}>
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#ffffff' }}>Settings</h1>
      <SettingsClient
        admins={admins ?? []}
        currentAdminId={currentAdmin?.id ?? ''}
        currentAdminRole={currentAdmin?.role ?? 'editor'}
        eligibleMembers={eligibleMembers}
      />
    </div>
  )
}


