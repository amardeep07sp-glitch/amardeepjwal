import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Numbered pages with an ellipsis for a large page count (1 2 3 ... 29),
// always showing the first, last, and a window around the current page -
// no page-size selector (that's an admin-panel concern; a shopper doesn't
// choose how many products load per page).
function buildPageList(page, totalPages) {
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
}

export function Pagination({ page, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const pageList = buildPageList(page, totalPages);

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {totalItems} results
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" disabled={!canGoPrevious} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>

        {pageList.map((p, index) => {
          const previous = pageList[index - 1];
          const showEllipsis = previous !== undefined && p - previous > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-sm text-muted-foreground">…</span>}
              <Button
                variant={p === page ? 'default' : 'outline'}
                size="icon-sm"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={cn(p === page && 'pointer-events-none')}
              >
                {p}
              </Button>
            </span>
          );
        })}

        <Button variant="outline" size="icon-sm" disabled={!canGoNext} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
