import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { usePurchaseReturns, useApprovePurchaseReturn, useRejectPurchaseReturn, useCompletePurchaseReturn } from './purchaseReturnsApi';
import { PURCHASE_RETURN_STATUS_LABELS, PURCHASE_RETURN_STATUS_BADGE_VARIANTS, PURCHASE_RETURN_ACTION_LABELS } from './purchaseSchema';

const STATUS_FILTER_ALL = 'all';

const TRANSITIONS = {
  requested: [{ label: 'Approve', hookKey: 'approve' }, { label: 'Reject', hookKey: 'reject' }],
  approved: [{ label: 'Complete', hookKey: 'complete' }],
};

export default function PurchaseReturnManagerPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = usePurchaseReturns({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: status === STATUS_FILTER_ALL ? undefined : status,
  });

  const hooks = {
    approve: useApprovePurchaseReturn(),
    reject: useRejectPurchaseReturn(),
    complete: useCompletePurchaseReturn(),
  };

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const runTransition = async (hookKey, id, label) => {
    try {
      await hooks[hookKey].mutateAsync(id);
      toast.success(`Return ${label.toLowerCase()}d`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'returnNumber', header: 'Return #' },
    { key: 'purchaseOrder', header: 'PO', render: (r) => r.purchaseOrder?.poNumber ?? '—' },
    { key: 'supplier', header: 'Supplier', render: (r) => r.supplier?.name ?? '—' },
    { key: 'action', header: 'Action', render: (r) => PURCHASE_RETURN_ACTION_LABELS[r.action] ?? r.action },
    { key: 'amount', header: 'Amount', render: (r) => `₹${r.amount.toFixed(2)}` },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={PURCHASE_RETURN_STATUS_BADGE_VARIANTS[r.status]} className="capitalize">
          {PURCHASE_RETURN_STATUS_LABELS[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-56',
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          {(TRANSITIONS[r.status] ?? []).map(({ label, hookKey }) => (
            <Button key={hookKey} size="sm" variant="outline" onClick={() => runTransition(hookKey, r.id, label)}>
              {label}
            </Button>
          ))}
          <Button variant="ghost" size="icon-sm" aria-label="View purchase order" onClick={() => navigate(`/admin/purchase-orders/${r.purchaseOrder?.id}`)}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Purchase Returns</h1>
        <p className="text-sm text-muted-foreground">Return-to-supplier requests across every purchase order.</p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        toolbarActions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {Object.entries(PURCHASE_RETURN_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No returns yet"
        emptyDescription="Return requests from a purchase order's detail page will show up here."
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
