import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Globe } from 'lucide-react';
import { useBrandBySlug } from '@/features/brands/brandsApi';
import { useProductList } from '@/features/products/productsApi';
import { track } from '@/lib/analytics';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { BackButton } from '@/components/global/BackButton';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Pagination } from '@/components/global/Pagination';
import { PageContainer } from '@/components/global/PageContainer';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeo } from '@/hooks/useSeo';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];
const PAGE_SIZE = 12;

function BrandHero({ brand }) {
  return (
    <div className="relative aspect-16/6 overflow-hidden rounded-2xl bg-secondary sm:aspect-21/6">
      {brand.bannerMedia ? (
        <img src={brand.bannerMedia.secureUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Award className="size-12 text-primary/40" strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}

export default function BrandDetailPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('featured');

  const { data: brand, isLoading: isBrandLoading, isError, error, refetch } = useBrandBySlug(slug);
  const { data, isLoading: isProductsLoading } = useProductList({ page, limit: PAGE_SIZE, brand: slug, sortBy });

  useEffect(() => {
    if (!brand) return;
    track('brand_view', { pageType: 'brand', metadata: { brandId: brand.id, brandSlug: slug } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?.id]);

  useSeo({
    title: brand?.seo?.metaTitle || brand?.name,
    description: brand?.seo?.metaDescription || brand?.description,
  });

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isBrandLoading) {
    return (
      <PageContainer top="md" bottom="md">
        <Skeleton className="aspect-16/6 w-full rounded-2xl sm:aspect-21/6" />
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

  if (!brand) return null;

  return (
    <div className="flex min-w-0 flex-col gap-10 pb-16 sm:gap-14">
      <PageContainer top="md" bottom="none">
        <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Brands', to: '/brands' }, { label: brand.name }]} />
        </div>
        <BrandHero brand={brand} />
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-h3 font-bold text-heading sm:text-h2">{brand.name}</h1>
            {brand.country && <p className="mt-1 text-sm text-muted-foreground">{brand.country}</p>}
            {brand.description && <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{brand.description}</p>}
          </div>
          {brand.website && (
            <Link
              to={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
            >
              <Globe className="size-4" /> Visit Website
            </Link>
          )}
        </div>
      </PageContainer>

      <PageContainer top="none" bottom="none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{brand.productCount} product{brand.productCount === 1 ? '' : 's'}</p>
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

        {isProductsLoading ? (
          <ResponsiveGrid count={PAGE_SIZE} className="gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </ResponsiveGrid>
        ) : data.items.length === 0 ? (
          <EmptyState title="No products from this brand yet" description="Check back soon - new pieces are on their way." />
        ) : (
          <>
            <ResponsiveGrid count={data.items.length} className="gap-4">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ResponsiveGrid>
            <div className="mt-8">
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} totalItems={data.meta.totalItems} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}
