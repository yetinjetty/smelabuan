import { createClient } from '@/lib/supabase/server'
import DirectoryClient from './DirectoryClient'
import type { Member } from '@/lib/types'

export default async function DirectoryPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('members')
    .select('id, member_id, full_name, business_name, business_sector, business_size, membership_type, status')
    .eq('status', 'active')
    .order('full_name')
    .returns<Pick<Member, 'id' | 'member_id' | 'full_name' | 'business_name' | 'business_sector' | 'business_size' | 'membership_type' | 'status'>[]>()

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Directory</h1>
      <DirectoryClient members={members ?? []} />
    </div>
  )
}
