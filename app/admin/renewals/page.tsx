import { createClient } from '@/lib/supabase/server'
import RenewalsClient from './RenewalsClient'
import type { Member } from '@/lib/types'

export default async function RenewalsPage() {
  const supabase = await createClient()
  const today = new Date()
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const { data: overdue } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'active')
    .lt('expiry_date', todayStr)
    .eq('membership_type', 'Ordinary')
    .order('expiry_date')
    .returns<Member[]>()

  const { data: dueSoon } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'active')
    .gte('expiry_date', todayStr)
    .lte('expiry_date', nextMonth)
    .eq('membership_type', 'Ordinary')
    .order('expiry_date')
    .returns<Member[]>()

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#111827' }}>
      <h1 className="text-2xl font-bold text-white mb-6">Renewals</h1>
      <RenewalsClient overdue={overdue ?? []} dueSoon={dueSoon ?? []} />
    </div>
  )
}

