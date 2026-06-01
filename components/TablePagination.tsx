'use client'

const PAGE_SIZES = [10, 20, 50]

export function PaginationBar({
  page, totalPages, total, pageSize,
  onPageChange, onPageSizeChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (ps: number) => void
}) {
  const from = totalPages === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between gap-4 text-sm flex-wrap">
      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#E05A4E]"
          style={{ backgroundColor: '#374151' }}
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span>{from}–{to} of {total}</span>
      </div>
      <div className="flex items-center gap-1">
        <PageBtn label="«" disabled={page === 1} onClick={() => onPageChange(1)} />
        <PageBtn label="‹" disabled={page === 1} onClick={() => onPageChange(page - 1)} />
        <span className="px-3 text-gray-400 text-xs">Page {page} of {Math.max(totalPages, 1)}</span>
        <PageBtn label="›" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} />
        <PageBtn label="»" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} />
      </div>
    </div>
  )
}

function PageBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded border border-gray-600 text-gray-400 text-xs hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  )
}
