import { Gem } from 'lucide-react';
import { EmptyState } from '@/components/global/EmptyState';
import { useCollectionProducts } from './collectionsApi';

// Not a live iframe of the real customer site (a real cross-app/auth
// boundary for marginal fidelity gain) and not a flat detail dump either -
// a scaled-down, admin-local re-creation of the actual landing page's
// structure, built from the form's own already-fetched/edited data.
// Explicitly labeled "approximate" so nobody mistakes it for pixel-perfect.
export function CollectionPreviewTab({ collectionId, values }) {
  const { data } = useCollectionProducts(collectionId, { limit: 8 }, { enabled: Boolean(collectionId) });
  const products = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Preview (approximate layout)</p>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="relative flex aspect-16/9 items-center justify-center bg-secondary">
          {values.promoVideoMedia ? (
            <video src={values.promoVideoMedia.secureUrl} className="size-full object-cover" muted loop autoPlay />
          ) : values.bannerMedia ? (
            <img src={values.bannerMedia.secureUrl} alt="" className="size-full object-cover" />
          ) : (
            <Gem className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <h3 className="font-display text-lg font-bold text-heading">{values.name || 'Untitled collection'}</h3>
          {values.shortDescription && <p className="text-sm text-muted-foreground">{values.shortDescription}</p>}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-heading">Products</p>
        {!collectionId ? (
          <EmptyState title="Save to preview products" description="Product resolution needs a saved collection." />
        ) : products.length === 0 ? (
          <EmptyState title="No products match yet" description="Check the Rules or Products tab." />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-1 overflow-hidden rounded-lg border border-border">
                <div className="flex aspect-square items-center justify-center bg-secondary">
                  {product.image ? (
                    <img src={product.image.secureUrl} alt={product.name} className="size-full object-cover" />
                  ) : (
                    <Gem className="size-6 text-muted-foreground/40" strokeWidth={1.25} />
                  )}
                </div>
                <p className="truncate px-1.5 pb-1.5 text-xs text-heading">{product.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {values.faqs?.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-heading">FAQ</p>
          <div className="flex flex-col gap-2">
            {values.faqs.map((faq, index) => (
              <div key={index} className="rounded-lg border border-border p-2.5">
                <p className="text-sm font-medium text-heading">{faq.question || 'Question'}</p>
                <p className="text-sm text-muted-foreground">{faq.answer || 'Answer'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
