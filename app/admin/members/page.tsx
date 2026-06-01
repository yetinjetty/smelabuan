import { createClient } from '@/lib/supabase/server'
import MembersTable from './MembersTable'
import type { Member } from '@/lib/types'

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; perPage?: string }>
}) {
  const { status, q, page, perPage } = await searchParams
  const supabase = await createClient()
  const pageNum = parseInt(page ?? '1', 10)
  const pageSize = [10, 20, 50].includes(parseInt(perPage ?? '', 10)) ? parseInt(perPage!, 10) : 10
  const from = (pageNum - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('members')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,member_id.ilike.%${q}%,business_name.ilike.%${q}%`)

  const { data: members, count } = await query.returns<Member[]>()

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#111827' }}>
      <MembersTable
        members={members ?? []}
        total={count ?? 0}
        page={pageNum}
        pageSize={pageSize}
        status={status}
        q={q}
        perPage={pageSize}
      />
    </div>
  )
}


