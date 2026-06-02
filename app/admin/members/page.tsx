import { createClient } from '@/lib/supabase/server'
import MembersTable from './MembersTable'
import type { Member } from '@/lib/types'

const VALID_SORT_COLS = new Set([
  'full_name', 'member_id', 'membership_type', 'business_name',
  'status', 'expiry_date', 'created_at',
])

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; perPage?: string; sortBy?: string; sortDir?: string }>
}) {
  const { status, q, page, perPage, sortBy, sortDir } = await searchParams
  const supabase = await createClient()
  const pageNum = parseInt(page ?? '1', 10)
  const pageSize = [10, 20, 50].includes(parseInt(perPage ?? '', 10)) ? parseInt(perPage!, 10) : 10
  const from = (pageNum - 1) * pageSize
  const to = from + pageSize - 1

  const orderCol = VALID_SORT_COLS.has(sortBy ?? '') ? sortBy! : 'created_at'
  const orderAsc = sortDir === 'asc'

  let query = supabase
    .from('members')
    .select('*', { count: 'exact' })
    .order(orderCol, { ascending: orderAsc })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,member_id.ilike.%${q}%,business_name.ilike.%${q}%`)

  const { data: members, count } = await query.returns<Member[]>()

  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: '#111827' }}>
      <MembersTable
        members={members ?? []}
        total={count ?? 0}
        page={pageNum}
        pageSize={pageSize}
        status={status}
        q={q}
        perPage={pageSize}
        sortBy={orderCol}
        sortDir={orderAsc ? 'asc' : 'desc'}
      />
    </div>
  )
}
