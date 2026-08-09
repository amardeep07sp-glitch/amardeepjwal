import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical, ImageOff } from 'lucide-react';
import { EmptyState } from '@/components/global/EmptyState';
import { useCollectionProducts, useReorderCollectionProducts } from './collectionsApi';

function ProductRow({ product }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
      {product.image ? (
        <img src={product.image.secureUrl} alt={product.name} className="size-full object-cover" />
      ) : (
        <ImageOff className="size-4 text-muted-foreground" />
      )}
    </div>
  );
}

// Drag-and-drop merchandising, manual sortMode only - framer-motion's
// Reorder is already an installed dependency (unused elsewhere), so this
// needs zero new library. onDragEnd fires once per drag gesture (not per
// intermediate reorder tick), which is exactly when the save should happen -
// no extra debounce logic needed.
export function ProductReorderList({ collectionId }) {
  const { data, isLoading } = useCollectionProducts(collectionId, { limit: 100 });
  const [order, setOrder] = useState([]);
  const reorder = useReorderCollectionProducts();

  useEffect(() => {
    if (data?.items) setOrder(data.items);
  }, [data]);

  const handleDragEnd = () => {
    reorder.mutate({ id: collectionId, orderedIds: order.map((p) => p.id) });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading products...</p>;
  if (order.length === 0) {
    return <EmptyState title="No products to order yet" description="Assign products in the Products tab first." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">Drag to reorder - the order here is exactly what customers see.</p>
      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex flex-col gap-2">
        {order.map((product) => (
          <Reorder.Item
            key={product.id}
            value={product}
            onDragEnd={handleDragEnd}
            className="flex cursor-grab items-center gap-3 rounded-lg border border-border bg-card p-2.5 active:cursor-grabbing"
          >
            <GripVertical className="size-4 shrink-0 text-muted-foreground" />
            <ProductRow product={product} />
            <span className="truncate text-sm font-medium text-heading">{product.name}</span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

// Any non-manual sort mode has a computed order - dragging would be
// meaningless, so this shows the resulting order read-only instead.
export function ProductOrderPreview({ collectionId }) {
  const { data, isLoading } = useCollectionProducts(collectionId, { limit: 100 });
  const items = data?.items ?? [];

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading products...</p>;
  if (items.length === 0) {
    return <EmptyState title="No products yet" description="Nothing currently matches this collection." />;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        This sort mode computes its own order - drag-and-drop is only available for Manual Sort.
      </p>
      {items.map((product, index) => (
        <div key={product.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
          <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
          <ProductRow product={product} />
          <span className="truncate text-sm font-medium text-heading">{product.name}</span>
        </div>
      ))}
    </div>
  );
}
