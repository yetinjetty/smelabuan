import { createServiceClient } from '@/lib/supabase/server'
import RenewalsClient from './RenewalsClient'
import type { Member } from '@/lib/types'

export default async function RenewalsPage() {
  const service = createServiceClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString().split('T')[0]
  const nextMonthName = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    .toLocaleString('en-MY', { month: 'long', year: 'numeric' })

  const [
    { data: overdue },
    { data: dueThisMonth },
    { count: dueNextMonthCount },
  ] = await Promise.all([
    service.from('members').select('*')
      .eq('membership_type', 'Ordinary')
      .lt('expiry_date', todayStr)
      .in('status', ['active', 'expired'])
      .order('expiry_date')
      .returns<Member[]>(),
    service.from('members').select('*')
      .eq('membership_type', 'Ordinary')
      .eq('status', 'active')
      .gte('expiry_date', todayStr)
      .lt('expiry_date', thisMonthEnd)
      .order('expiry_date')
      .returns<Member[]>(),
    service.from('members').select('*', { count: 'exact', head: true })
      .eq('membership_type', 'Ordinary')
      .eq('status', 'active')
      .gte('expiry_date', thisMonthEnd)
      .lt('expiry_date', nextMonthEnd),
  ])

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#111827' }}>
      <RenewalsClient
        overdue={overdue ?? []}
        dueThisMonth={dueThisMonth ?? []}
        dueNextMonthCount={dueNextMonthCount ?? 0}
        nextMonthName={nextMonthName}
        todayStr={todayStr}
      />
    </div>
  )
}
