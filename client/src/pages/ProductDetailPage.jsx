import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, Heart, ShoppingBag, Star } from 'lucide-react';
import { useProductBySlug } from '@/features/products/productsApi';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useMyWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/features/storefront/storefrontApi';
import { track, trackProductViewEnd } from '@/lib/analytics';
import { useSeo } from '@/hooks/useSeo';
import { ImageGallery, PriceBreakdown, VariantSelector, ReviewsSection } from '@/components/product';
import { SimilarProducts } from '@/components/sections/SimilarProducts';
import { TrustBadges } from '@/components/sections/TrustBadges';
import { ContextualHelp } from '@/components/support/ContextualHelp';
import { ReportProblemButton } from '@/components/support/ReportProblemButton';
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

  useSeo({
    title: product?.seo?.metaTitle || (product ? `${product.name} | Amardeep Swarna Kala Kendra` : undefined),
    description: product?.seo?.metaDescription || product?.shortDescription,
    canonical: product?.seo?.canonicalUrl || undefined,
    image: product?.seo?.ogImageMedia?.secureUrl || product?.images?.[0]?.secureUrl,
    // Real Product rich-result schema - every value here is the same live
    // data already rendered on the page (price, stock, rating), never a
    // placeholder. `availability`/`price` deliberately use the base
    // product's own values, not a selected variant's override - schema.org
    // Product markup describes the product as listed, not whichever
    // variant a visitor happens to have clicked.
    jsonLd: product
      ? {
          '@type': 'Product',
          name: product.name,
          description: product.shortDescription || product.description,
          image: product.images?.map((img) => img.secureUrl).filter(Boolean),
          sku: product.sku,
          brand: product.brand?.name ? { '@type': 'Brand', name: product.brand.name } : undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.price?.finalPrice,
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
          ...(product.rating?.count > 0
            ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating.average, reviewCount: product.rating.count } }
            : {}),
        }
      : null,
  });

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
    product.metal && { label: 'Metal', value: product.metal.charAt(0).toUpperCase() + product.metal.slice(1) },
    product.purity && { label: 'Purity', value: product.purity },
    product.gemstoneType && product.gemstoneType !== 'none' && {
      label: 'Gemstone',
      value: product.gemstoneType.charAt(0).toUpperCase() + product.gemstoneType.slice(1),
    },
    ...(selectedVariant?.attributes ?? [])
      .filter((pair) => pair.attribute?.name && pair.value?.value)
      .map((pair) => ({ label: pair.attribute.name, value: pair.value.value })),
  ].filter(Boolean);

  return (
    <div className="flex min-w-0 flex-col gap-8 pb-16 sm:gap-10">
      <PageContainer top="md" bottom="none">
        <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
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

          <div className="flex flex-col gap-4 lg:sticky lg:top-32 lg:h-fit">
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

            {product.rating?.count > 0 && (
              <a href="#reviews" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                <Star className="size-4 fill-warning text-warning" />
                <span className="font-medium text-heading">{product.rating.average.toFixed(1)}</span>
                <span className="underline-offset-2 hover:underline">
                  ({product.rating.count} review{product.rating.count === 1 ? '' : 's'})
                </span>
              </a>
            )}

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
            <ContextualHelp slug="jewellery-pricing-explained" label="How is jewellery pricing calculated?" className="-mt-2 w-fit" />

            <div className="mt-2 flex items-center gap-3">
              <Button 
                size="lg" 
                className="flex-1 gap-2 bg-gradient-luxury text-primary-foreground shadow-luxury transition-all duration-300 hover:shadow-hover hover:scale-[1.02] border-0" 
                disabled={!displayInStock} 
                onClick={handleAddToCart}
              >
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

            <div className="border-t border-border pt-4">
              <ReportProblemButton
                category="product"
                entityType="product"
                entityId={product.id}
                context={{ productName: name, productUrl: window.location.href }}
                triggerLabel="Report a problem with this product"
                variant="ghost"
                className="text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </PageContainer>

      <TrustBadges />

      <PageContainer top="none" bottom="none">
        <h2 className="mb-6 font-display text-h3 font-bold text-heading">Ratings & Reviews</h2>
        <ReviewsSection productId={product.id} slug={slug} />
      </PageContainer>

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
