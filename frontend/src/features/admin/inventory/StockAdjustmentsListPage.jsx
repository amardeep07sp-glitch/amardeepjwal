import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useStockAdjustments, useApproveStockAdjustment, useRejectStockAdjustment } from './stockAdjustmentsApi';
import { NewStockAdjustmentModal } from './NewStockAdjustmentModal';

const STATUS_FILTER_ALL = 'all';
const STATUS_BADGE_VARIANTS = { pending: 'warning', approved: 'success', rejected: 'destructive' };

export default function StockAdjustmentsListPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useStockAdjustments({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
  });
  const approveAdjustment = useApproveStockAdjustment();
  const rejectAdjustment = useRejectStockAdjustment();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleApprove = async (adjustment) => {
    try {
      await approveAdjustment.mutateAsync(adjustment.id);
      toast.success('Adjustment approved and applied');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (adjustment) => {
    try {
      await rejectAdjustment.mutateAsync(adjustment.id);
      toast.success('Adjustment rejected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'sku', header: 'SKU', render: (a) => a.inventory?.sku ?? '—' },
    { key: 'product', header: 'Product', render: (a) => a.inventory?.product?.name ?? '—' },
    {
      key: 'type',
      header: 'Change',
      render: (a) => (
        <span className={a.type === 'increase' ? 'text-success' : 'text-destructive'}>
          {a.type === 'increase' ? '+' : '-'}
          {a.quantity}
        </span>
      ),
    },
    { key: 'reason', header: 'Reason' },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <Badge variant={STATUS_BADGE_VARIANTS[a.status]} className="capitalize">
          {a.status}
        </Badge>
      ),
    },
    { key: 'requestedBy', header: 'Requested By', render: (a) => a.requestedBy?.name ?? '—' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (adjustment) =>
        adjustment.status === 'pending' ? (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Approve" onClick={() => handleApprove(adjustment)}>
              <Check className="size-4 text-success" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Reject" onClick={() => handleReject(adjustment)}>
              <X className="size-4 text-destructive" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground">Manual stock corrections, always with a reason and a ledger entry.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus />
          New adjustment
        </Button>
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
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="No adjustments yet"
        emptyDescription="Submit a manual stock correction to see it here."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <NewStockAdjustmentModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
