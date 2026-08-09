import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, Heart, ShoppingBag } from 'lucide-react';
import { useProductBySlug } from '@/features/products/productsApi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useMyWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/features/storefront/storefrontApi';
import { track, trackProductViewEnd } from '@/lib/analytics';
import { ImageGallery, PriceBreakdown, VariantSelector } from '@/components/product';
import { SimilarProducts } from '@/components/sections/SimilarProducts';
import { TrustBadges } from '@/components/sections/TrustBadges';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { BackButton } from '@/components/global/BackButton';
import { PageContainer } from '@/components/global/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/config/appConfig';
import { categoryPath, brandPath } from '@/config/navConfig';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: product, isLoading, isError, error, refetch } = useProductBySlug(slug);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { data: wishlist } = useMyWishlist({ enabled: Boolean(user) });
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const viewStartRef = useRef(null);

  // Reset the selected variant whenever the product itself changes -
  // React Router keeps this component mounted across /products/:slug ->
  // /products/:otherSlug navigations, it doesn't remount.
  useEffect(() => {
    if (!product) return;
    setSelectedVariant(product.variants?.find((v) => v.isDefault) ?? product.variants?.[0] ?? null);
  }, [product]);

  // A product_view is reported once per product visited, with a real
  // timeSpentSeconds - fired on leaving this product (route change, tab
  // close, or the component unmounting), not on arrival, since a
  // write-once event can only carry an accurate duration if it's sent
  // after the time was actually spent (see analytics.js#trackProductViewEnd).
  useEffect(() => {
    if (!product) return undefined;
    viewStartRef.current = Date.now();

    const flush = () => {
      if (!viewStartRef.current) return;
      trackProductViewEnd(product.id, (Date.now() - viewStartRef.current) / 1000);
      viewStartRef.current = null;
    };

    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [product]);

  if (isLoading) return <ProductDetailSkeleton />;

  if (isError) {
    if (error?.statusCode === 404) {
      return (
        <PageContainer top="md" bottom="md">
          <EmptyState
            title="Product not found"
            description="This product may have been removed or is no longer available."
            actionLabel="Back to Home"
            onAction={() => {
              window.location.assign('/');
            }}
          />
        </PageContainer>
      );
    }
    return <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />;
  }

  const { name, category, brand, price, priceBreakdown, images, inStock, stockQuantity, shortDescription, description, tags, variants } =
    product;

  // A selected variant (if any) overrides the base product's price/stock -
  // priceOverride is the variant's own total final price, not a delta.
  const displayPrice = selectedVariant?.priceOverride != null ? { ...price, finalPrice: selectedVariant.priceOverride, discountPercentage: 0 } : price;
  const displayInStock = selectedVariant ? selectedVariant.inStock : inStock;
  const displayStockQuantity = selectedVariant ? selectedVariant.stockQuantity : stockQuantity;
  const isLowStock = displayInStock && displayStockQuantity > 0 && displayStockQuantity <= LOW_STOCK_THRESHOLD;
  const isWishlisted = wishlist?.some((row) => row.product?.id === product.id) ?? false;

  const handleToggleWishlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isWishlisted) {
      removeFromWishlist.mutate({ productId: product.id });
      track('wishlist_remove', { metadata: { productId: product.id } });
    } else {
      addToWishlist.mutate({ product: product.id });
      track('wishlist_add', { metadata: { productId: product.id } });
    }
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      slug: product.slug,
      name: product.name,
      image: images?.[0]?.secureUrl,
      price: displayPrice.finalPrice,
      quantity: 1,
    });
    track('add_to_cart', { metadata: { productId: product.id, quantity: 1, price: displayPrice.finalPrice } });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  const specs = [
    brand?.name && { label: 'Brand', value: brand.name },
    category?.name && { label: 'Category', value: category.name },
    ...(selectedVariant?.attributes ?? [])
      .filter((pair) => pair.attribute?.name && pair.value?.value)
      .map((pair) => ({ label: pair.attribute.name, value: pair.value.value })),
  ].filter(Boolean);

  return (
    <div className="flex min-w-0 flex-col gap-10 pb-16 sm:gap-14">
      <PageContainer top="md" bottom="none">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <BackButton />
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              ...(category ? [{ label: category.name, to: categoryPath(category.slug) }] : []),
              { label: name },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <ImageGallery images={images} name={name} productId={product.id} />

          <div className="flex flex-col gap-4">
            {(category || brand) && (
              <p className="text-xs text-muted-foreground">
                {brand?.name && (
                  <Link to={brandPath(brand.slug)} className="hover:text-primary">
                    {brand.name}
                  </Link>
                )}
                {brand?.name && category?.name && ' · '}
                {category?.name}
              </p>
            )}

            <h1 className="text-h3 font-semibold text-heading sm:text-h2">{name}</h1>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-semibold text-heading">{formatPrice(displayPrice.finalPrice)}</span>
              {displayPrice.discountPercentage > 0 && (
                <>
                  <span className="text-base text-muted-foreground line-through">{formatPrice(displayPrice.mrp)}</span>
                  <Badge>{displayPrice.discountPercentage}% OFF</Badge>
                </>
              )}
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">Inclusive of all taxes</p>

            {!displayInStock ? (
              <Badge variant="destructive" className="w-fit">
                Out of Stock
              </Badge>
            ) : (
              isLowStock && (
                <Badge variant="warning" className="w-fit">
                  Only {displayStockQuantity} left!
                </Badge>
              )
            )}

            {shortDescription && <p className="text-sm text-muted-foreground">{shortDescription}</p>}

            {variants?.length > 0 && (
              <VariantSelector variants={variants} selectedVariantId={selectedVariant?.id} onSelect={setSelectedVariant} />
            )}

            <PriceBreakdown price={displayPrice} breakdown={priceBreakdown} />

            <div className="mt-2 flex items-center gap-3">
              <Button size="lg" className="flex-1 gap-2" disabled={!displayInStock} onClick={handleAddToCart}>
                {justAdded ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
                {justAdded ? 'Added to Cart' : 'Add to Cart'}
              </Button>
              <Button
                size="icon-lg"
                variant="outline"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={isWishlisted}
                onClick={handleToggleWishlist}
                className={cn(isWishlisted && 'text-primary')}
              >
                <Heart className={cn('size-4.5', isWishlisted && 'fill-current')} />
              </Button>
            </div>

            {specs.length > 0 && (
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex flex-col">
                    <dt className="text-xs text-muted-foreground">{spec.label}</dt>
                    <dd className="font-medium text-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {description && (
              <div className="border-t border-border pt-4">
                <h2 className="mb-2 text-sm font-semibold text-heading">Product Details</h2>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{description}</p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      <TrustBadges />
      <SimilarProducts slug={slug} />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <PageContainer top="md" bottom="md">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </PageContainer>
  );
}
