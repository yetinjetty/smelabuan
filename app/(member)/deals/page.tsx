import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Deal } from '@/lib/types'

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .returns<Deal[]>()

  const categories = Array.from(new Set((deals ?? []).map(d => d.category).filter(Boolean)))

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Benefits</h1>

      {categories.length > 0 && (
        <div className="space-y-6">
          {categories.map(cat => {
            const catDeals = (deals ?? []).filter(d => d.category === cat)
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{cat}</h2>
                <div className="space-y-3">
                  {catDeals.map(deal => (
                    <div key={deal.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{deal.merchant_name}</p>
                          {deal.offer_description && (
                            <p className="text-sm text-gray-600 mt-1">{deal.offer_description}</p>
                          )}
                          {deal.valid_until && (
                            <p className="text-xs text-gray-400 mt-2">
                              Valid until {format(new Date(deal.valid_until), 'd MMM yyyy')}
                            </p>
                          )}
                        </div>
                        {deal.discount_value && (
                          <span
                            className="flex-none text-sm font-bold px-3 py-1.5 rounded-xl text-white"
                            style={{ backgroundColor: '#E05A4E' }}
                          >
                            {deal.discount_value}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(!deals || deals.length === 0) && (
        <p className="text-center text-gray-400 py-20">No deals available yet</p>
      )}
    </div>
  )
}
