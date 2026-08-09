import { cn } from '@/lib/utils';

// A fixed `grid-cols-4` template still reserves 4 equal-width column
// tracks even with only 1-2 real items - the lone card renders at a normal
// size but with a wide, empty void beside it (grid tracks don't collapse
// just because they're unused). Capping both the column count AND the
// container's own max-width to what the item count actually needs removes
// that void instead of just leaving it there at a fixed card size. Every
// small-card grid site-wide (products, collections, categories, related
// items) should render through this instead of a bare `grid grid-cols-N`,
// so the fix - and any future tweak to it - lives in exactly one place.
export function ResponsiveGrid({ count, className, children }) {
  return (
    <div
      className={cn(
        'grid',
        count === 1
          ? 'max-w-60 grid-cols-1'
          : count === 2
            ? 'max-w-md grid-cols-2'
            : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}
