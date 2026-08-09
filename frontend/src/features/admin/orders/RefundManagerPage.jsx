import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useRefunds, useProcessRefund, useFailRefund } from './orderRefundsApi';
import { REFUND_STATUS_BADGE_VARIANTS } from './orderSchema';

const STATUS_FILTER_ALL = 'all';

export default function RefundManagerPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useRefunds({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: status === STATUS_FILTER_ALL ? undefined : status,
  });
  const processRefund = useProcessRefund();
  const failRefund = useFailRefund();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const runAction = async (mutation, payload, message) => {
    try {
      await mutation.mutateAsync(payload);
      toast.success(message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'order', header: 'Order', render: (r) => r.order?.orderNumber ?? '—' },
    { key: 'type', header: 'Type', render: (r) => <span className="capitalize">{r.type}</span> },
    { key: 'amount', header: 'Amount', render: (r) => r.amount.toFixed(2) },
    { key: 'method', header: 'Method', render: (r) => r.method || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={REFUND_STATUS_BADGE_VARIANTS[r.status]} className="capitalize">
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-48',
      render: (r) => (
        <div className="flex items-center gap-1">
          {r.status === 'pending' && (
            <>
              <Button size="sm" variant="outline" onClick={() => runAction(processRefund, { id: r.id }, 'Refund processed')}>
                Process
              </Button>
              <Button size="sm" variant="ghost" onClick={() => runAction(failRefund, { id: r.id }, 'Refund marked failed')}>
                Fail
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon-sm" aria-label="View order" onClick={() => navigate(`/admin/orders/${r.order?.id}`)}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Refunds</h1>
        <p className="text-sm text-muted-foreground">Every refund across every order.</p>
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
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="No refunds yet"
        emptyDescription="Refunds created from an order's detail page will show up here."
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
