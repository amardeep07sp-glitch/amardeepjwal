import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Flame, Gem, LayoutGrid, Loader2, Search, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchSuggestions } from '@/features/products/productsApi';
import { categoryPath } from '@/config/navConfig';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export const searchPath = (q) => `/search?q=${encodeURIComponent(q)}`;

const TRENDING_SEARCHES = [
  'Gold Rings',
  'Diamond Necklace',
  'Mudrika Brand',
  'Bridal Sets',
  'Mangalsutra',
  'Gold Coins 24K',
  'Bangles & Bracelets',
  'Earrings',
];

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function SearchBar({ className, autoFocus = false, onSubmit, onNavigate }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const closeTimer = useRef(null);
  const containerRef = useRef(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data, isFetching } = useSearchSuggestions(debouncedQuery);
  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const hasSuggestions = products.length > 0 || categories.length > 0;

  const flatItems = useMemo(
    () => [
      ...categories.map((c) => ({ type: 'category', key: `c-${c.id}`, path: categoryPath(c.slug) })),
      ...products.map((p) => ({ type: 'product', key: `p-${p.id}`, path: `/products/${p.slug}` })),
      ...(query.trim() ? [{ type: 'viewAll', key: 'view-all', path: searchPath(query.trim()) }] : []),
    ],
    [categories, products, query]
  );

  useEffect(() => setActiveIndex(-1), [debouncedQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const goTo = (path) => {
    setIsOpen(false);
    if (onNavigate) onNavigate();
    if (onSubmit) onSubmit(query);
    navigate(path);
  };

  const runSearch = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setIsOpen(false);
    if (onNavigate) onNavigate();
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
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (flatItems.length > 0) {
        setActiveIndex((i) => (i + 1) % flatItems.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (flatItems.length > 0) {
        setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setActiveIndex(-1);
  };

  const showSuggestions = isOpen && query.trim().length > 0;
  const showTrending = isOpen && query.trim().length === 0;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} role="search" className="relative w-full">
        <button
          type="submit"
          aria-label="Submit search"
          className="cursor-pointer absolute top-1/2 left-3.5 -translate-y-1/2 text-[#B88A2F] transition-transform duration-200 hover:scale-110"
        >
          <Search className="size-4" />
        </button>

        <Input
          name="q"
          type="text"
          autoFocus={autoFocus}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for gold jewellery, Mudrika, rings, diamonds..."
          className="h-10 sm:h-10.5 w-full rounded-full border border-[#E6DCC5] bg-[#FCFAF6] pr-10 pl-10 text-xs sm:text-sm text-[#2B1B0E] placeholder:text-[#9A9180] transition-all duration-200 focus:border-[#C8A24D] focus:bg-white focus:ring-2 focus:ring-[#C8A24D]/20 shadow-xs"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />

        {query.trim().length > 0 && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear search text"
            className="cursor-pointer absolute top-1/2 right-3 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-[#EFE7D8] text-[#6A6357] transition-colors hover:bg-[#C8A24D] hover:text-white"
          >
            <X className="size-3" />
          </button>
        )}
      </form>

      {/* Trending / Popular Searches Dropdown when focused on empty input */}
      {showTrending && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full overflow-hidden rounded-2xl border border-[#EFE7D8] bg-white p-3.5 shadow-[0_20px_50px_rgba(27,15,5,0.12)]">
          <div className="flex items-center gap-1.5 pb-2.5 text-xs font-semibold text-[#9A6B12] uppercase tracking-wider">
            <Flame className="size-3.5 text-[#C8A24D]" />
            Trending Searches
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TRENDING_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(item);
                  runSearch(item);
                }}
                className="cursor-pointer flex items-center gap-1.5 rounded-full border border-[#EAE0CD] bg-[#FAF8F4] px-3 py-1.5 text-xs text-[#3F3A33] transition-all duration-200 hover:border-[#C8A24D] hover:bg-[#FFF9EF] hover:text-[#9A6B12]"
              >
                <Sparkles className="size-2.5 text-[#C8A24D]" />
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full overflow-hidden rounded-2xl border border-[#EFE7D8] bg-white shadow-[0_20px_50px_rgba(27,15,5,0.12)]">
          {isFetching && !hasSuggestions ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs sm:text-sm text-[#8A8378]">
              <Loader2 className="size-4 animate-spin text-[#C8A24D]" /> Searching catalogue...
            </div>
          ) : !hasSuggestions ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runSearch(query)}
              className="cursor-pointer flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-xs sm:text-sm text-[#6B655C] hover:bg-[#FFF9EF] hover:text-[#9A6B12]"
            >
              <Search className="size-4 text-[#C8A24D]" />
              Search all products for &ldquo;<span className="font-semibold text-[#2A080C]">{query.trim()}</span>&rdquo;
            </button>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {categories.length > 0 && (
                <div className="px-2 pb-1">
                  <p className="px-2.5 py-1 text-[11px] font-bold tracking-wider text-[#9A6B12] uppercase">
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
                          'cursor-pointer flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs sm:text-sm transition-colors',
                          activeIndex === index ? 'bg-[#FFF9EF] text-[#9A6B12] font-medium' : 'text-[#3E3A33] hover:bg-[#FAF6EE]'
                        )}
                      >
                        <LayoutGrid className="size-4 text-[#C8A24D]" />
                        <span className="min-w-0 flex-1 truncate">{c.name}</span>
                        <ArrowRight className="size-3 text-[#9A9180]" />
                      </button>
                    );
                  })}
                </div>
              )}

              {products.length > 0 && (
                <div className="px-2 pt-1 border-t border-[#F3EDE0]">
                  <p className="px-2.5 py-1 text-[11px] font-bold tracking-wider text-[#9A6B12] uppercase">
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
                          'cursor-pointer flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                          activeIndex === index ? 'bg-[#FFF9EF]' : 'hover:bg-[#FAF6EE]'
                        )}
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#FCFAF6] border border-[#EFE7D8]">
                          {p.image ? (
                            <img src={p.image.secureUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <Gem className="size-4 text-[#C8A24D]/60" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs sm:text-sm font-medium text-[#2A080C]">{p.name}</span>
                          <span className="block text-xs font-semibold text-[#B88A2F]">{formatPrice(p.price.finalPrice)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-1 border-t border-[#EFE7D8] px-2 pt-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runSearch(query)}
                  onMouseEnter={() => setActiveIndex(flatItems.length - 1)}
                  className={cn(
                    'cursor-pointer flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-left text-xs sm:text-sm font-medium text-[#9A6B12] transition-colors',
                    activeIndex === flatItems.length - 1 ? 'bg-[#FFF9EF]' : 'hover:bg-[#FAF6EE]'
                  )}
                >
                  <span>View all results for &ldquo;{query.trim()}&rdquo;</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
