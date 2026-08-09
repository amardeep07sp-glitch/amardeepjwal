import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';

// Re-adds a past order's real items to the cart - fetches the order's own
// items fresh (never trusts a cached list-view row, which doesn't carry
// item data) and adds each by its real product/variant. An item snapshotted
// before slug tracking existed (orderItem.model.js#productSnapshot) has no
// slug to resolve back to a live product, so it's skipped rather than
// added broken - the caller decides how to report that, this just returns
// the real counts.
export async function buyOrderAgain(orderId) {
  const res = await api.get(`/storefront/orders/${orderId}`);
  const items = res.data.items ?? [];
  const addItem = useCartStore.getState().addItem;

  let added = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.productSnapshot?.slug) {
      skipped += 1;
      continue;
    }
    addItem({
      productId: typeof item.product === 'object' ? item.product.id : item.product,
      variantId: item.variant ? (typeof item.variant === 'object' ? item.variant.id : item.variant) : null,
      slug: item.productSnapshot.slug,
      name: item.productSnapshot.name,
      image: item.productSnapshot.image || undefined,
      price: item.unitPrice,
      quantity: item.quantity,
    });
    added += 1;
  }

  return { added, skipped };
}
