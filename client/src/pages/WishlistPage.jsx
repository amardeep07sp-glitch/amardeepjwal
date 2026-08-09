import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useMyWishlist } from '@/features/storefront/storefrontApi';
import { useAuthStore } from '@/store/authStore';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';

export default function WishlistPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { data, isLoading, isError, error, refetch } = useMyWishlist({ enabled: Boolean(user) });

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  return (
    <PageContainer top="sm" bottom="md">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />
      </div>

      <h1 className="mb-6 flex items-center gap-2.5 text-h3 font-display font-bold text-heading sm:text-h2">
        <Heart className="size-6 text-primary sm:size-7" />
        Wishlist
        {data?.length > 0 && <span className="text-base font-normal text-muted-foreground">({data.length})</span>}
      </h1>

      {isError ? (
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <ResponsiveGrid count={8} className="gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 xl:gap-x-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </ResponsiveGrid>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any piece you love to save it here."
          actionLabel="Explore Products"
          onAction={() => navigate('/products')}
        />
      ) : (
        <ResponsiveGrid count={data.length} className="gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 xl:gap-x-6">
          {data.map((row) => (
            <ProductCard key={row.id} product={row.product} />
          ))}
        </ResponsiveGrid>
      )}
    </PageContainer>
  );
}
