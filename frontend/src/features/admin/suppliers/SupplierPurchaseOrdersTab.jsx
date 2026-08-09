import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/global/EmptyState';
import { usePurchaseOrders } from '../purchases/purchaseOrdersApi';
import { PO_STATUS_LABELS, PO_STATUS_BADGE_VARIANTS } from '../purchases/purchaseSchema';

export function SupplierPurchaseOrdersTab({ supplierId }) {
  const navigate = useNavigate();
  const { data } = usePurchaseOrders({ supplier: supplierId, limit: 20 });
  const purchaseOrders = data?.items ?? [];

  if (purchaseOrders.length === 0) {
    return <EmptyState title="No purchase orders yet" description="Purchase orders placed with this supplier will appear here." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {purchaseOrders.map((po) => (
        <li
          key={po.id}
          className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
          onClick={() => navigate(`/admin/purchase-orders/${po.id}`)}
        >
          <span>{po.poNumber} · {new Date(po.createdAt).toLocaleDateString()}</span>
          <div className="flex items-center gap-2">
            <span>₹{po.grandTotal.toFixed(2)}</span>
            <Badge variant={PO_STATUS_BADGE_VARIANTS[po.status]} className="capitalize">
              {PO_STATUS_LABELS[po.status] ?? po.status}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}
