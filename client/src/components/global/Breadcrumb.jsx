import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// `items`: [{ label, to? }] - the last item (or any item without a `to`)
// renders as plain text, everything else as a Home-style Link. Extracted out
// of ProductListingPage.jsx/ProductDetailPage.jsx's near-identical inline
// blocks once a third page (Collection detail) needed the same thing.
export function Breadcrumb({ items, className }) {
  return (
    <nav className={cn('flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground', className)}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <span>/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
