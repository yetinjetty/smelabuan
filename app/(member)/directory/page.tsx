import { createServiceClient } from '@/lib/supabase/server'
import DirectoryClient from './DirectoryClient'
import type { Member } from '@/lib/types'

export default async function DirectoryPage() {
  const service = createServiceClient()
  const { data: members } = await service
    .from('members')
    .select('id, member_id, full_name, business_name, business_sector, business_size, membership_type, status')
    .eq('status', 'active')
    .order('full_name')
    .returns<Pick<Member, 'id' | 'member_id' | 'full_name' | 'business_name' | 'business_sector' | 'business_size' | 'membership_type' | 'status'>[]>()

  return <DirectoryClient members={members ?? []} />
}
