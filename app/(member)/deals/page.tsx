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
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            {/* Animated icon */}
            <div className="relative mb-6">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center animate-bounce"
                style={{ background: 'linear-gradient(135deg, #E05A4E 0%, #c0392b 100%)', boxShadow: '0 8px 32px rgba(224,90,78,0.3)' }}
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
              </div>
              {/* Decorative dots */}
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-300 animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400" />
            </div>

            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Coming Soon!</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
              Exclusive member deals and discounts are on their way.
              Keep an eye out for special offers from our partners!
            </p>

            {/* Decorative tags */}
            <div className="flex gap-2 flex-wrap justify-center">
              {['Dining', 'Travel', 'Business', 'Retail'].map(tag => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full border font-medium"
                  style={{ borderColor: '#E05A4E', color: '#E05A4E', backgroundColor: 'rgba(224,90,78,0.06)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
