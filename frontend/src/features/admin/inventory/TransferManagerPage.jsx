import { useState } from 'react';
import { Plus, Check, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import {
  useStockTransfers,
  useApproveStockTransfer,
  useCompleteStockTransfer,
  useCancelStockTransfer,
} from './stockTransfersApi';
import { NewTransferModal } from './NewTransferModal';

const STATUS_FILTER_ALL = 'all';
const STATUS_BADGE_VARIANTS = {
  requested: 'warning',
  approved: 'info',
  completed: 'success',
  rejected: 'destructive',
  cancelled: 'secondary',
};

export default function TransferManagerPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useStockTransfers({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
  });
  const approveTransfer = useApproveStockTransfer();
  const completeTransfer = useCompleteStockTransfer();
  const cancelTransfer = useCancelStockTransfer();

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
    { key: 'sku', header: 'SKU', render: (t) => t.inventory?.sku ?? '—' },
    { key: 'product', header: 'Product', render: (t) => t.inventory?.product?.name ?? '—' },
    { key: 'fromWarehouse', header: 'From', render: (t) => t.fromWarehouse?.name ?? '—' },
    { key: 'toWarehouse', header: 'To', render: (t) => t.toWarehouse?.name ?? '—' },
    { key: 'quantity', header: 'Qty' },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <Badge variant={STATUS_BADGE_VARIANTS[t.status]} className="capitalize">
          {t.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-32',
      render: (transfer) => (
        <div className="flex items-center gap-1">
          {transfer.status === 'requested' && (
            <>
              <Button variant="ghost" size="icon-sm" aria-label="Approve" onClick={() => runAction(approveTransfer, transfer.id, 'Transfer approved')}>
                <Check className="size-4 text-success" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => runAction(cancelTransfer, transfer.id, 'Transfer cancelled')}>
                <XCircle className="size-4 text-destructive" />
              </Button>
            </>
          )}
          {transfer.status === 'approved' && (
            <Button variant="ghost" size="icon-sm" aria-label="Complete" onClick={() => runAction(completeTransfer, transfer.id, 'Transfer completed')}>
              <Truck className="size-4 text-success" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Stock Transfers</h1>
          <p className="text-sm text-muted-foreground">Move stock between warehouses with a full audit trail.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus />
          Request transfer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(t) => t.id}
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
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="No transfers yet"
        emptyDescription="Request your first inter-warehouse transfer to see it here."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <NewTransferModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
