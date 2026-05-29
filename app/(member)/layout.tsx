import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberNav from '@/components/MemberNav'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('full_name, status, membership_type')
    .eq('auth_user_id', user.id)
    .single()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 pb-20">{children}</main>
      <MemberNav />
    </div>
  )
}
