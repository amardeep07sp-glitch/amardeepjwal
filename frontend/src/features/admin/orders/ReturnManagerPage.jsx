import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import {
  useReturns,
  useApproveReturn,
  useRejectReturn,
  useSchedulePickup,
  useMarkReturnReceived,
  useMarkReturnInspected,
  useAcceptReturn,
  useRestockReturn,
} from './orderReturnsApi';
import { RETURN_STATUS_LABELS, RETURN_STATUS_BADGE_VARIANTS } from './orderSchema';

const STATUS_FILTER_ALL = 'all';

const TRANSITIONS = {
  requested: [{ label: 'Approve', hookKey: 'approve' }, { label: 'Reject', hookKey: 'reject' }],
  approved: [{ label: 'Schedule Pickup', hookKey: 'schedulePickup' }],
  pickup_scheduled: [{ label: 'Mark Received', hookKey: 'receive' }],
  received: [{ label: 'Mark Inspected', hookKey: 'inspect' }],
  inspected: [{ label: 'Accept', hookKey: 'accept' }, { label: 'Reject', hookKey: 'reject' }],
  accepted: [{ label: 'Restock', hookKey: 'restock' }],
};

export default function ReturnManagerPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useReturns({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: status === STATUS_FILTER_ALL ? undefined : status,
  });

  const hooks = {
    approve: useApproveReturn(),
    reject: useRejectReturn(),
    schedulePickup: useSchedulePickup(),
    receive: useMarkReturnReceived(),
    inspect: useMarkReturnInspected(),
    accept: useAcceptReturn(),
    restock: useRestockReturn(),
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
    { key: 'order', header: 'Order', render: (r) => r.order?.orderNumber ?? '—' },
    { key: 'items', header: 'Items', render: (r) => `${r.items.length} item(s)` },
    { key: 'reason', header: 'Reason', render: (r) => r.reason || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={RETURN_STATUS_BADGE_VARIANTS[r.status]} className="capitalize">
          {RETURN_STATUS_LABELS[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-64',
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          {(TRANSITIONS[r.status] ?? []).map(({ label, hookKey }) => (
            <Button key={hookKey} size="sm" variant="outline" onClick={() => runTransition(hookKey, r.id, label)}>
              {label}
            </Button>
          ))}
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
        <h1 className="text-h4 font-semibold text-heading">Returns</h1>
        <p className="text-sm text-muted-foreground">Return requests across every order, from request through restock.</p>
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
              {Object.entries(RETURN_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No returns yet"
        emptyDescription="Return requests from an order's detail page will show up here."
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
