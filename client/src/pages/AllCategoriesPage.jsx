import { Link, useSearchParams } from 'react-router-dom';
import { useCategoryList } from '@/features/categories/categoriesApi';
import { CategoryIcon } from '@/components/category';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Pagination } from '@/components/global/Pagination';
import { BackButton } from '@/components/global/BackButton';
import { PageContainer } from '@/components/global/PageContainer';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryPath } from '@/config/navConfig';

const PAGE_SIZE = 20;

export default function AllCategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1) || 1;

  const { data, isLoading, isError, error, refetch } = useCategoryList({ page, limit: PAGE_SIZE });

  const handlePageChange = (nextPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageContainer top="md" bottom="md">
      <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
        <h1 className="text-h3 font-display font-bold text-heading sm:text-h2">All Categories</h1>
      </div>

      {isError ? (
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <ResponsiveGrid count={8} className="gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 rounded-lg p-4 ring-1 ring-border">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </ResponsiveGrid>
      ) : data.items.length === 0 ? (
        <EmptyState title="No categories yet" description="Categories added from the admin panel will show up here." />
      ) : (
        <>
          <ResponsiveGrid count={data.items.length} className="gap-4">
            {data.items.map((category) => (
              <Link
                key={category.id}
                to={categoryPath(category.slug)}
                className="group flex flex-col items-center gap-3 rounded-lg p-4 text-center ring-1 ring-border transition-colors hover:border-primary/50"
              >
                <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-105">
                  <CategoryIcon category={category} className="size-6" />
                </span>
                <div>
                  <p className="font-medium text-heading">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.productCountRecursive} products</p>
                </div>
              </Link>
            ))}
          </ResponsiveGrid>
          <div className="mt-8">
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              totalItems={data.meta.totalItems}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}
