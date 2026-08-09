import { useState } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { useInventoryForProduct } from './inventoryApi';
import { STOCK_STATUS_BADGE_VARIANTS } from './inventorySchema';
import { InventoryDetailDrawer } from './InventoryDetailDrawer';

// Embedded in ProductFormModal's Inventory tab - shows every Inventory
// record for this product (one for the simple product itself, or one per
// variant x warehouse) using the same scoped-list-inside-a-tab pattern as
// VariantsTabContent/PricingTabContent.
export function InventoryTabContent({ productId }) {
  const { data: items, isLoading, error, refetch } = useInventoryForProduct(productId);
  const [selectedInventoryId, setSelectedInventoryId] = useState(null);

  if (isLoading) return <PageLoader label="Loading inventory..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;
  if (!items || items.length === 0) {
    return <EmptyState title="No inventory records yet" description="These are provisioned automatically when a product or variant is created." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((inventory) => (
        <div key={inventory.id} className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-heading">
              {inventory.variant ? inventory.variant.sku : inventory.sku}
            </p>
            <p className="text-xs text-muted-foreground">{inventory.warehouse?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="font-semibold text-heading">{inventory.availableQuantity} available</p>
              <p className="text-xs text-muted-foreground">{inventory.reservedQuantity} reserved</p>
            </div>
            <Badge variant={STOCK_STATUS_BADGE_VARIANTS[inventory.stockStatus]} className="capitalize">
              {inventory.stockStatus.replace('_', ' ')}
            </Badge>
            <Button variant="ghost" size="icon-sm" aria-label="View inventory" onClick={() => setSelectedInventoryId(inventory.id)}>
              <Eye className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      <InventoryDetailDrawer
        inventoryId={selectedInventoryId}
        open={Boolean(selectedInventoryId)}
        onOpenChange={(open) => !open && setSelectedInventoryId(null)}
      />
    </div>
  );
}
