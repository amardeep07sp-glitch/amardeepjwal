import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { ChevronDown, Gem } from 'lucide-react';
import { useCollectionBySlug, useCollectionProductsInfinite } from '@/features/collections/collectionsApi';
import { track } from '@/lib/analytics';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { CollectionCard } from '@/components/collection';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { BackButton } from '@/components/global/BackButton';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/global/PageContainer';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';
import { useSeo } from '@/hooks/useSeo';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-lg border border-border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-heading hover:bg-muted/50">
        {faq.question}
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3 text-sm text-muted-foreground">{faq.answer}</CollapsibleContent>
    </Collapsible>
  );
}

function CollectionHero({ collection }) {
  const { bannerMedia, mobileBannerMedia, promoVideoMedia } = collection;

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-secondary sm:aspect-16/7 lg:aspect-21/7">
      {promoVideoMedia ? (
        <video
          src={promoVideoMedia.secureUrl}
          poster={bannerMedia?.secureUrl}
          className="size-full object-cover"
          controls
          playsInline
        />
      ) : bannerMedia || mobileBannerMedia ? (
        <>
          {mobileBannerMedia && <img src={mobileBannerMedia.secureUrl} alt="" className={cn('size-full object-cover', bannerMedia && 'sm:hidden')} />}
          {bannerMedia && <img src={bannerMedia.secureUrl} alt="" className={cn('size-full object-cover', mobileBannerMedia ? 'hidden sm:block' : 'block')} />}
        </>
      ) : (
        <div className="flex size-full items-center justify-center">
          <Gem className="size-12 text-primary/40" strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}

// Random per browsing session, not per page - reused across every
// fetchNextPage call so a "random" sortMode collection's shuffle stays
// stable while scrolling instead of re-sampling (and duplicating/skipping
// items) on every page.
function useRandomSeed() {
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));
  return seed;
}

export default function CollectionDetailPage() {
  const { slug } = useParams();
  const [sortBy, setSortBy] = useState('recommended');
  const [priceInputs, setPriceInputs] = useState({ minPrice: '', maxPrice: '' });
  const [appliedPriceRange, setAppliedPriceRange] = useState({});
  const randomSeed = useRandomSeed();

  const { data: collection, isLoading: isCollectionLoading, isError, error, refetch } = useCollectionBySlug(slug);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isProductsLoading,
  } = useCollectionProductsInfinite(slug, {
    limit: 12,
    randomSeed,
    sortBy: sortBy === 'recommended' ? undefined : sortBy,
    ...appliedPriceRange,
  });

  const { ref: sentinelRef, inView } = useInView({ triggerOnce: false });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!collection) return;
    track('collection_view', { pageType: 'collection', metadata: { collectionId: collection.id, collectionSlug: slug } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection?.id]);

  useSeo({
    title: collection?.seo?.metaTitle || collection?.name,
    description: collection?.seo?.metaDescription || collection?.shortDescription,
    canonical: collection?.seo?.canonicalUrl,
  });

  const products = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const totalItems = data?.pages?.[0]?.meta?.totalItems ?? 0;

  const applyPriceFilter = () => {
    setAppliedPriceRange({
      minPrice: priceInputs.minPrice === '' ? undefined : Number(priceInputs.minPrice),
      maxPrice: priceInputs.maxPrice === '' ? undefined : Number(priceInputs.maxPrice),
    });
  };

  if (isCollectionLoading) {
    return (
      <PageContainer top="md" bottom="md">
        <Skeleton className="aspect-4/3 w-full rounded-2xl sm:aspect-16/7 lg:aspect-21/7" />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer top="md" bottom="md">
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      </PageContainer>
    );
  }

  if (!collection) return null;

  return (
    <div className="flex min-w-0 flex-col gap-10 pb-16 sm:gap-14">
      <PageContainer top="md" bottom="none">
        <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Collections', to: '/collections' }, { label: collection.name }]} />
        </div>
        <CollectionHero collection={collection} />
        <h1 className="mt-6 font-display text-h3 font-bold text-heading sm:text-h2">{collection.name}</h1>
        {collection.shortDescription && <p className="mt-2 text-muted-foreground">{collection.shortDescription}</p>}
        {collection.description && <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{collection.description}</p>}
      </PageContainer>

      <PageContainer top="none" bottom="none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{totalItems} product{totalItems === 1 ? '' : 's'}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Min ₹"
              className="h-9 w-24 text-sm"
              value={priceInputs.minPrice}
              onChange={(e) => setPriceInputs((prev) => ({ ...prev, minPrice: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              placeholder="Max ₹"
              className="h-9 w-24 text-sm"
              value={priceInputs.maxPrice}
              onChange={(e) => setPriceInputs((prev) => ({ ...prev, maxPrice: e.target.value }))}
            />
            <Button type="button" variant="outline" size="sm" onClick={applyPriceFilter}>
              Apply
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-44 text-sm">
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
          </div>
        </div>

        {isProductsLoading ? (
          <ResponsiveGrid count={8} className="gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </ResponsiveGrid>
        ) : products.length === 0 ? (
          <EmptyState title="No products in this collection yet" description="Check back soon - new pieces are on their way." />
        ) : (
          <>
            <ResponsiveGrid count={products.length} className="gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ResponsiveGrid>
            <div ref={sentinelRef} className="mt-6 flex justify-center">
              {isFetchingNextPage && <Skeleton className="h-9 w-32 rounded-full" />}
            </div>
          </>
        )}
      </PageContainer>

      {collection.faqs?.length > 0 && (
        <PageContainer top="none" bottom="none">
          <h2 className="mb-4 font-display text-h3 font-bold text-heading">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-2">
            {collection.faqs.map((faq, index) => (
              <FaqItem key={index} faq={faq} />
            ))}
          </div>
        </PageContainer>
      )}

      {collection.relatedCollections?.length > 0 && (
        <PageContainer top="none" bottom="none">
          <h2 className="mb-4 font-display text-h3 font-bold text-heading">Related Collections</h2>
          <ResponsiveGrid count={collection.relatedCollections.length} className="gap-4">
            {collection.relatedCollections.map((related) => (
              <CollectionCard key={related.id} collection={related} />
            ))}
          </ResponsiveGrid>
        </PageContainer>
      )}
    </div>
  );
}
