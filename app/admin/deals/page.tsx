import { createClient } from '@/lib/supabase/server'
import DealsAdmin from './DealsAdmin'
import type { Deal } from '@/lib/types'

export default async function AdminDealsPage() {
  const supabase = await createClient()
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Deal[]>()

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#111827' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#ffffff' }}>Merchant Deals</h1>
      <DealsAdmin deals={deals ?? []} />
    </div>
  )
}

