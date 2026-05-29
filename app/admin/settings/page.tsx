import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'
import type { AdminUser } from '@/lib/types'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: admins } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at')
    .returns<AdminUser[]>()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      <SettingsClient admins={admins ?? []} />
    </div>
  )
}
