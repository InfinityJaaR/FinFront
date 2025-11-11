import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Pagination component
 * props:
 * - pagination: { current_page, last_page, total, per_page }
 * - onPageChange(page)
 * - isLoading (optional)
 */
const Pagination = ({ pagination = {}, onPageChange = () => {}, isLoading = false }) => {
  const current = Number(pagination.current_page) || 1
  const last = Number(pagination.last_page) || (pagination.per_page ? Math.max(1, Math.ceil((pagination.total || 0) / pagination.per_page)) : 1)

  const makePages = () => {
    const pages = []
    const start = Math.max(1, current - 2)
    const end = Math.min(last, current + 2)
    for (let p = start; p <= end; p++) pages.push(p)
    // ensure first and last are present if far
    if (!pages.includes(1)) pages.unshift(1)
    if (!pages.includes(last)) pages.push(last)
    return pages
  }

  const pages = makePages()

  if (last <= 1) return null

  return (
    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <p className="text-sm text-gray-700">
        Mostrando página <span className="font-medium">{current}</span> de <span className="font-medium">{last}</span>
      </p>
      <div className="flex-1 flex justify-end gap-2 items-center">
        <Button size="sm" variant="outline" onClick={() => onPageChange(current - 1)} disabled={current === 1 || isLoading}>
          <ChevronLeft size={16} className="mr-2" />
          Anterior
        </Button>

        {pages.map((p, idx) => {
          const isGap = idx > 0 && p - pages[idx - 1] > 1
          return (
            <React.Fragment key={String(p) + idx}>
              {isGap && <span className="px-2">...</span>}
              <Button size="sm" variant={p === current ? 'primary' : 'outline'} onClick={() => onPageChange(p)} disabled={isLoading}>
                {p}
              </Button>
            </React.Fragment>
          )
        })}

        <Button size="sm" variant="outline" onClick={() => onPageChange(current + 1)} disabled={current === last || isLoading}>
          Siguiente
          <ChevronRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
