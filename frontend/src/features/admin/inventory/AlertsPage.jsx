import { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useInventoryAlerts, useAcknowledgeAlert, useResolveAlert } from './inventoryAlertsApi';

const STATUS_FILTER_ALL = 'all';
const STATUS_BADGE_VARIANTS = { open: 'destructive', acknowledged: 'warning', resolved: 'success' };
const TYPE_LABELS = {
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  negative_stock_attempt: 'Negative Stock Attempt',
  reorder_required: 'Reorder Required',
  inactive_inventory: 'Inactive Inventory',
  expired_reservation: 'Expired Reservation',
};

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState('open');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useInventoryAlerts({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
  });
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const runAction = async (mutation, id, successMessage) => {
    try {
      await mutation.mutateAsync(id);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'sku', header: 'SKU', render: (a) => a.inventory?.sku ?? '—' },
    { key: 'product', header: 'Product', render: (a) => a.inventory?.product?.name ?? '—' },
    { key: 'warehouse', header: 'Warehouse', render: (a) => a.inventory?.warehouse?.name ?? '—' },
    { key: 'type', header: 'Type', render: (a) => TYPE_LABELS[a.type] ?? a.type },
    { key: 'message', header: 'Message', render: (a) => <span className="text-sm text-muted-foreground">{a.message}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <Badge variant={STATUS_BADGE_VARIANTS[a.status]} className="capitalize">
          {a.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (alert) => (
        <div className="flex items-center gap-1">
          {alert.status === 'open' && (
            <Button variant="ghost" size="icon-sm" aria-label="Acknowledge" onClick={() => runAction(acknowledgeAlert, alert.id, 'Alert acknowledged')}>
              <Check className="size-4 text-warning" />
            </Button>
          )}
          {alert.status !== 'resolved' && (
            <Button variant="ghost" size="icon-sm" aria-label="Resolve" onClick={() => runAction(resolveAlert, alert.id, 'Alert resolved')}>
              <CheckCheck className="size-4 text-success" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Inventory Alerts</h1>
        <p className="text-sm text-muted-foreground">Low stock, out-of-stock, and reorder alerts raised automatically by the ledger.</p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        toolbarActions={
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="No alerts"
        emptyDescription="Everything looks healthy — no stock alerts match this filter."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
