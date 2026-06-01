'use client'

import { PaginationBar } from '@/components/TablePagination'

export default function LogPaginationBar({
  page, totalPages, total, pageSize, action,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  action?: string
}) {
  const base = action ? `action=${action}&` : ''
  return (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={p => { window.location.href = `/admin/log?${base}page=${p}&perPage=${pageSize}` }}
      onPageSizeChange={ps => { window.location.href = `/admin/log?${base}page=1&perPage=${ps}` }}
    />
  )
}
