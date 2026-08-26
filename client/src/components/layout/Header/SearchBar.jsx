import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gem, LayoutGrid, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchSuggestions } from '@/features/products/productsApi';
import { categoryPath } from '@/config/navConfig';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export const searchPath = (q) => `/search?q=${encodeURIComponent(q)}`;

// 300ms - long enough that a fast typist doesn't fire a request per
// keystroke, short enough that the dropdown still feels live. Re-debounces
// on every keystroke (the timer resets each render), not a fixed interval.
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function SearchBar({ className, autoFocus = false, onSubmit }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const closeTimer = useRef(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isFetching } = useSearchSuggestions(debouncedQuery);
  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const hasSuggestions = products.length > 0 || categories.length > 0;

  // One flat, keyboard-navigable list backing arrow-key movement - built in
  // display order (categories, then products, then the "view all" row) so
  // `activeIndex` maps 1:1 onto what's actually rendered below.
  const flatItems = useMemo(
    () => [
      ...categories.map((c) => ({ type: 'category', key: `c-${c.id}`, path: categoryPath(c.slug) })),
      ...products.map((p) => ({ type: 'product', key: `p-${p.id}`, path: `/products/${p.slug}` })),
      ...(query.trim() ? [{ type: 'viewAll', key: 'view-all', path: searchPath(query.trim()) }] : []),
    ],
    [categories, products, query]
  );

  useEffect(() => setActiveIndex(-1), [debouncedQuery]);

  const goTo = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const runSearch = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setIsOpen(false);
    if (onSubmit) onSubmit(trimmed);
    else navigate(searchPath(trimmed));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (activeIndex >= 0 && flatItems[activeIndex]) {
      goTo(flatItems[activeIndex].path);
      return;
    }
    runSearch(query);
  };

  const handleKeyDown = (event) => {
    if (!isOpen || flatItems.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % flatItems.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // A short delay (not an immediate close) so a click on a suggestion below
  // has time to register before the dropdown unmounts out from under it -
  // cancelled on the next focus so it never fires after the visitor has
  // already moved on.
  const handleBlur = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 150);
  };
  const handleFocus = () => {
    clearTimeout(closeTimer.current);
    setIsOpen(true);
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} role="search" className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#B88A2F]" />
      <Input
        name="q"
        type="search"
        autoFocus={autoFocus}
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search for gold jewellery, Mudrika, rings, diamonds..."
        className="h-10.5 rounded-full border border-[#E8DFC9] bg-[#FAF8F4] pr-4 pl-11 text-sm text-[#2B1B0E] placeholder:text-[#9A9180] transition-all duration-200 focus:border-[#C8A24D] focus:bg-white focus:ring-2 focus:ring-[#C8A24D]/20 shadow-inner/5"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
      />

      {showDropdown && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-full overflow-hidden rounded-2xl border border-[#EFE7D8] bg-white shadow-[0_20px_50px_rgba(27,15,5,0.12)]">
          {isFetching && !hasSuggestions ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching...
            </div>
          ) : !hasSuggestions ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runSearch(query)}
              className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              <Search className="size-4" />
              No quick matches - search all products for "{query.trim()}"
            </button>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {categories.length > 0 && (
                <div className="px-2 pb-1">
                  <p className="px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Categories
                  </p>
                  {categories.map((c) => {
                    const item = flatItems.find((f) => f.key === `c-${c.id}`);
                    const index = flatItems.indexOf(item);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => goTo(categoryPath(c.slug))}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm',
                          activeIndex === index ? 'bg-muted text-foreground' : 'text-foreground/80 hover:bg-muted'
                        )}
                      >
                        <LayoutGrid className="size-4 text-primary" />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {products.length > 0 && (
                <div className="px-2 pt-1">
                  <p className="px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Products
                  </p>
                  {products.map((p) => {
                    const item = flatItems.find((f) => f.key === `p-${p.id}`);
                    const index = flatItems.indexOf(item);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => goTo(`/products/${p.slug}`)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left',
                          activeIndex === index ? 'bg-muted' : 'hover:bg-muted'
                        )}
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {p.image ? (
                            <img src={p.image.secureUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <Gem className="size-4 text-primary/40" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">{p.name}</span>
                          <span className="block text-xs font-medium text-primary">{formatPrice(p.price.finalPrice)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-1 border-t border-border px-2 pt-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runSearch(query)}
                  onMouseEnter={() => setActiveIndex(flatItems.length - 1)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium text-primary',
                    activeIndex === flatItems.length - 1 ? 'bg-muted' : 'hover:bg-muted'
                  )}
                >
                  View all results for "{query.trim()}"
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
