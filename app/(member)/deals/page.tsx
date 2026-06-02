import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { Deal } from '@/lib/types'
import FadeCard from '@/components/FadeCard'

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
    <div>
      {/* Red header */}
      <div
        className="px-6 pt-8 pb-8"
        style={{ background: 'linear-gradient(160deg, #E05A4E 0%, #c0392b 100%)' }}
      >
        <h1 className="text-xl font-bold text-white">Member Benefits</h1>
      </div>

      {/* Content sheet */}
      <div className="bg-gray-50 px-6 pt-5 pb-28">
        {categories.length > 0 && (
          <div className="space-y-6">
            {categories.map(cat => {
              const catDeals = (deals ?? []).filter(d => d.category === cat)
              return (
                <div key={cat}>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{cat}</h2>
                  <div className="space-y-3">
                    {catDeals.map(deal => (
                      <FadeCard key={deal.id}>
                      <div className="bg-white rounded-2xl border border-gray-200 p-4">
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
                      </FadeCard>
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
    </div>
  )
}
