import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { useProductFacets, useProductList } from '@/features/products/productsApi';
import { useCategoryBySlug } from '@/features/categories/categoriesApi';
import { track } from '@/lib/analytics';
import { ProductCard, ProductCardSkeleton, ProductFilterSidebar, ProductListItem } from '@/components/product';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Pagination } from '@/components/global/Pagination';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { BackButton } from '@/components/global/BackButton';
import { PageContainer } from '@/components/global/PageContainer';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';
import { TrendingNow } from '@/components/sections/TrendingNow';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

// The one product-grid page - used for /products (All Products),
// /new-arrivals, /category/:slug and /offers, differing only in which
// fixed filters get passed in as props vs. left to the user (sort,
// category/price/tag facets, page).
export default function ProductListingPage({ title, sortBy: fixedSortBy, onSale = false }) {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const page = Number(searchParams.get('page') ?? 1) || 1;
  const sortBy = fixedSortBy ?? searchParams.get('sortBy') ?? 'featured';
  const search = searchParams.get('q')?.trim() || undefined;
  const filters = {
    categories: searchParams.get('categories')?.split(',').filter(Boolean) ?? [],
    brands: searchParams.get('brands')?.split(',').filter(Boolean) ?? [],
    tags: searchParams.get('tags')?.split(',').filter(Boolean) ?? [],
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    gender: searchParams.get('gender') ?? undefined,
    occasion: searchParams.get('occasion')?.split(',').filter(Boolean) ?? [],
  };

  const { data: category } = useCategoryBySlug(slug);
  // Shares react-query's cache with ProductFilterSidebar's own facets fetch
  // below (identical queryKey) - only used here to resolve category slugs
  // to display names for the active-filter chip row.
  const { data: facets } = useProductFacets();
  const { data, isLoading, isError, error, refetch } = useProductList({
    page,
    limit: PAGE_SIZE,
    category: slug,
    // A dedicated category page is scoped by its route already - the
    // sidebar's own category checkboxes only apply on unscoped listings
    // (All Products / New Arrivals / Offers), never layered on top of it.
    categories: slug ? undefined : filters.categories,
    brands: filters.brands,
    tags: filters.tags,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    gender: filters.gender,
    occasion: filters.occasion,
    search,
    sortBy,
    onSale,
  });

  const heading = slug ? (category?.name ?? ' ') : search ? `Search results for "${search}"` : title;

  // One `search` event per distinct query, when its results actually land
  // (not per keystroke - that's SearchBar's own autocomplete, a different
  // signal) - real resultCount, so searchAnalytics.service.js's "No Result
  // Searches" report is reading what a visitor actually saw, not a guess.
  useEffect(() => {
    if (!search || isLoading || !data) return;
    track('search', { pageType: 'search', metadata: { query: search, resultCount: data.meta.totalItems } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isLoading]);

  // The funnel's "Category" step (cip.constants.js FUNNEL_STEPS) - fires
  // once per category landed on, not per filter/sort/page tweak within it.
  useEffect(() => {
    if (!slug || !category) return;
    track('category_view', { pageType: 'category', metadata: { categoryId: category.id, categorySlug: slug } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, category?.id]);

  const updateParams = (mutate) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      mutate(next);
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (nextPage) => updateParams((p) => p.set('page', String(nextPage)));

  const handleSortChange = (value) => {
    track('sort_applied', { metadata: { sortBy: value } });
    updateParams((p) => {
      p.set('sortBy', value);
      p.set('page', '1');
    });
  };

  const handleApplyFilters = (next) => {
    track('filter_applied', {
      metadata: {
        categories: next.categories,
        brands: next.brands,
        tags: next.tags,
        minPrice: next.minPrice,
        maxPrice: next.maxPrice,
        gender: next.gender,
        occasion: next.occasion,
      },
    });
    updateParams((p) => {
      p.set('page', '1');
      if (next.categories.length) p.set('categories', next.categories.join(','));
      else p.delete('categories');
      if (next.brands?.length) p.set('brands', next.brands.join(','));
      else p.delete('brands');
      if (next.tags.length) p.set('tags', next.tags.join(','));
      else p.delete('tags');
      if (next.minPrice !== undefined) p.set('minPrice', String(next.minPrice));
      else p.delete('minPrice');
      if (next.maxPrice !== undefined) p.set('maxPrice', String(next.maxPrice));
      else p.delete('maxPrice');
      if (next.gender) p.set('gender', next.gender);
      else p.delete('gender');
      if (next.occasion?.length) p.set('occasion', next.occasion.join(','));
      else p.delete('occasion');
    });
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    updateParams((p) => {
      p.delete('categories');
      p.delete('brands');
      p.delete('tags');
      p.delete('minPrice');
      p.delete('maxPrice');
      p.delete('gender');
      p.delete('occasion');
      p.set('page', '1');
    });
    setIsFilterOpen(false);
  };

  const removeCategory = (value) =>
    updateParams((p) => {
      const next = filters.categories.filter((c) => c !== value);
      if (next.length) p.set('categories', next.join(','));
      else p.delete('categories');
      p.set('page', '1');
    });

  const removeBrand = (value) =>
    updateParams((p) => {
      const next = filters.brands.filter((b) => b !== value);
      if (next.length) p.set('brands', next.join(','));
      else p.delete('brands');
      p.set('page', '1');
    });

  const removeTag = (value) =>
    updateParams((p) => {
      const next = filters.tags.filter((t) => t !== value);
      if (next.length) p.set('tags', next.join(','));
      else p.delete('tags');
      p.set('page', '1');
    });

  const removeGender = () =>
    updateParams((p) => {
      p.delete('gender');
      p.set('page', '1');
    });

  const removeOccasion = (value) =>
    updateParams((p) => {
      const next = filters.occasion.filter((o) => o !== value);
      if (next.length) p.set('occasion', next.join(','));
      else p.delete('occasion');
      p.set('page', '1');
    });

  const removePriceRange = () =>
    updateParams((p) => {
      p.delete('minPrice');
      p.delete('maxPrice');
      p.set('page', '1');
    });

  // Leaving the search page entirely (not just clearing `q` on it) - there's
  // no unscoped "/search with no term" page to fall back to the way
  // /products is the fallback for every other filter here.
  const removeSearch = () => navigate('/products');

  // Removable pills for whatever's currently applied - a price range chip
  // (only when set), the unscoped-page category checkboxes (a dedicated
  // /category/:slug route is its own filter already, so it never doubles up
  // here), then tags. Real facets data resolves category slugs to names.
  const activeChips = [
    ...(search ? [{ key: 'search', label: `"${search}"`, onRemove: removeSearch }] : []),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? [
        {
          key: 'price-range',
          label: `${filters.minPrice !== undefined ? formatPrice(filters.minPrice) : 'Min'} - ${filters.maxPrice !== undefined ? formatPrice(filters.maxPrice) : 'Max'
            }`,
          onRemove: removePriceRange,
        },
      ]
      : []),
    ...(slug
      ? []
      : filters.categories.map((c) => ({
        key: `category-${c}`,
        label: facets?.categories?.find((cat) => cat.slug === c)?.name ?? c,
        onRemove: () => removeCategory(c),
      }))),
    ...filters.brands.map((b) => ({
      key: `brand-${b}`,
      label: facets?.brands?.find((brand) => brand.slug === b)?.name ?? b,
      onRemove: () => removeBrand(b),
    })),
    ...filters.tags.map((t) => ({ key: `tag-${t}`, label: t, onRemove: () => removeTag(t) })),
    ...(filters.gender
      ? [
        {
          key: 'gender',
          label: facets?.genders?.find((g) => g.value === filters.gender)?.label ?? filters.gender,
          onRemove: removeGender,
        },
      ]
      : []),
    ...filters.occasion.map((o) => ({
      key: `occasion-${o}`,
      label: facets?.occasions?.find((f) => f.value === o)?.label ?? o,
      onRemove: () => removeOccasion(o),
    })),
  ];

  const sidebarContent = (
    <ProductFilterSidebar
      filters={filters}
      onApply={handleApplyFilters}
      onClear={handleClearFilters}
      hideCategoryFacet={Boolean(slug)}
    />
  );

  const rangeStart = data?.items.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = data?.items.length ? (page - 1) * PAGE_SIZE + data.items.length : 0;

  const isEmpty = !isLoading && !isError && data?.items.length === 0;
  // A failed search's sidebar/sort/view-toggle controls have nothing left
  // to act on (0 results either way), and the global facet counts they'd
  // show (e.g. "Ring (8)") don't reflect the search at all - actively
  // misleading here, not just unhelpful. Filtered-to-zero (no search
  // involved) keeps the normal layout since Clear Filters is still a real,
  // useful action there.
  const isSearchEmpty = Boolean(search) && isEmpty;
  const hasOtherFilters = Boolean(
    filters.categories.length || filters.brands.length || filters.tags.length || filters.gender || filters.occasion.length ||
      filters.minPrice !== undefined || filters.maxPrice !== undefined
  );

  return (
    <PageContainer top="sm" bottom="sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
        <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, ...(slug ? [{ label: 'Shop', to: '/products' }] : []), { label: heading }]} />
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border pb-5 sm:mb-6 sm:pb-6 lg:mb-8 lg:pb-7">
        <div>
          <h1 className="text-h3 font-display font-bold tracking-tight text-heading sm:text-h2">{heading}</h1>
          {!isLoading && data && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {data.meta.totalItems} products
            </p>
          )}
        </div>

        {/* Desktop-only text controls - mobile/tablet get the icon pill row
            below instead (matches a real mobile jewellery-storefront PLP).
            Nothing to sort/switch layout for when a search came back empty. */}
        {!isSearchEmpty && (
          <div className="hidden items-center gap-3 lg:flex">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="h-10 w-44 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-lg ring-1 ring-border">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={cn(
                  'flex size-10 items-center justify-center rounded-l-lg transition-colors',
                  viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={cn(
                  'flex size-10 items-center justify-center rounded-r-lg border-l border-border transition-colors',
                  viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile/tablet control row: circular filter + sort icon buttons,
          scrollable active-filter chips - the reference layout's pill row. */}
      {!isSearchEmpty && (
        <div className="-mt-2 mb-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none lg:hidden">
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            aria-label="Open filters"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground ring-1 ring-border active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="size-4" />
          </button>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger
              aria-label="Sort products"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary p-0 text-foreground ring-1 ring-border [&>svg:last-child]:hidden"
            >
              <ArrowUpDown className="size-4" />
            </SelectTrigger>
            <SelectContent align="start">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeChips.length > 0 && <div className="mx-0.5 h-6 w-px shrink-0 bg-border" aria-hidden="true" />}

          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3.5 text-xs font-medium text-primary ring-1 ring-primary/20"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
        </div>
      )}

      {isSearchEmpty ? (
        // No sidebar (its global facet counts don't reflect the failed
        // search - actively misleading here, see the isSearchEmpty
        // comment above), full-width recovery instead: a real "browse
        // everything" CTA plus the same real Trending Now data the
        // homepage shows, so a dead-end search still leaves somewhere to go.
        <div className="flex flex-col items-center gap-12 py-6 text-center">
          <EmptyState
            title="No products found"
            description={`We couldn't find anything for "${search}". Try a different word, or browse everything below.`}
            actionLabel="Browse All Products"
            onAction={() => navigate('/products')}
          />
          <div className="w-full border-t border-border pt-10">
            <TrendingNow bare />
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr] lg:gap-10 xl:gap-12">
        <aside className="hidden min-w-0 lg:block">{sidebarContent}</aside>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetContent side="left" className="w-[85%] gap-0 overflow-y-auto sm:max-w-sm">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="p-4">{sidebarContent}</div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          {isError ? (
            <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
          ) : isLoading ? (
            // Always the grid skeleton, even in list view - a brief loading
            // state doesn't need to match the final layout pixel-for-pixel,
            // and ProductCardSkeleton's square shape only stays proportioned
            // inside a grid column (see ProductListItem for why list view
            // needs its own, differently-shaped row instead).
            <ResponsiveGrid count={PAGE_SIZE} className="gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 xl:gap-x-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </ResponsiveGrid>
          ) : isEmpty ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or browse another category."
              actionLabel={hasOtherFilters ? 'Clear Filters' : undefined}
              onAction={hasOtherFilters ? handleClearFilters : undefined}
            />
          ) : viewMode === 'list' ? (
            <>
              <div className="flex flex-col gap-3 sm:gap-4">
                {data.items.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-8 border-t border-border pt-6 sm:mt-10 sm:pt-8">
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  totalItems={data.meta.totalItems}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <>
              <ResponsiveGrid count={data.items.length} className="gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 xl:gap-x-6">
                {data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </ResponsiveGrid>
              <div className="mt-8 border-t border-border pt-6 sm:mt-10 sm:pt-8">
                <Pagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  totalItems={data.meta.totalItems}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </PageContainer>
  );
}