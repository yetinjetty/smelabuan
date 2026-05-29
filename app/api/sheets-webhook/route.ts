import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: 'Invalid JSON' }, { status: 400 })

  // Manual sync trigger from settings page
  if (body.action === 'manual_sync') {
    return Response.json({ ok: true, message: 'Sync triggered' })
  }

  // Rows pushed from Apps Script
  const rows: Array<{
    member_id: string
    full_name: string
    email: string
    phone?: string
    business_name?: string
    business_sector?: string
    business_size?: string
    membership_type?: string
    status?: string
    member_since?: string
    expiry_date?: string
    updated_at: string
  }> = Array.isArray(body) ? body : [body]

  const supabase = await createServiceClient()

  let synced = 0
  let skipped = 0

  for (const row of rows) {
    if (!row.member_id || !row.updated_at) { skipped++; continue }

    const { data: existing } = await supabase
      .from('members')
      .select('id, updated_at')
      .eq('member_id', row.member_id)
      .single()

    if (!existing) { skipped++; continue }

    const sheetDate = new Date(row.updated_at)
    const dbDate = new Date(existing.updated_at)

    // Only update if sheet version is strictly newer
    if (sheetDate <= dbDate) { skipped++; continue }

    await supabase
      .from('members')
      .update({
        full_name: row.full_name,
        email: row.email,
        phone: row.phone ?? null,
        business_name: row.business_name ?? null,
        business_sector: row.business_sector ?? null,
        business_size: row.business_size ?? null,
        membership_type: row.membership_type ?? null,
        status: row.status ?? 'pending',
        member_since: row.member_since ?? null,
        expiry_date: row.expiry_date ?? null,
        updated_at: row.updated_at,
      })
      .eq('id', existing.id)

    await supabase.from('activity_log').insert({
      member_id: existing.id,
      action: 'synced',
      details: `Synced from Google Sheets (sheet updated_at: ${row.updated_at})`,
    })

    synced++
  }

  return Response.json({ ok: true, synced, skipped })
}
