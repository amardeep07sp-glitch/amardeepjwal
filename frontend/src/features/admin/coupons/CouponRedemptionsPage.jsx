import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useCouponRedemptions } from './couponsApi';

const STATUS_FILTER_ALL = 'all';
const STATUS_OPTIONS = [
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];
const STATUS_VARIANTS = { redeemed: 'success', cancelled: 'secondary', refunded: 'warning' };

const formatDate = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// The real, permanent per-order ledger (couponRedemption.model.js) - every
// row here is undeletable history, only ever status-transitioned
// (redeemed -> cancelled/refunded) by order.service.js#cancelOrder /
// orderReturn.service.js#restockReturn, never removed.
export default function CouponRedemptionsPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useCouponRedemptions({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
  });

  const redemptions = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    { key: 'code', header: 'Coupon', render: (r) => <span className="font-mono text-sm font-semibold text-heading">{r.code}</span> },
    { key: 'customer', header: 'Customer', render: (r) => r.customer?.name ?? '-' },
    { key: 'order', header: 'Order', render: (r) => r.order?.orderNumber ?? '-' },
    { key: 'discountAmount', header: 'Discount', render: (r) => `₹${r.discountAmount.toLocaleString('en-IN')}` },
    { key: 'discountBase', header: 'Base', render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.discountBase.replace(/_/g, ' ')}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={STATUS_VARIANTS[r.status] ?? 'secondary'} className="capitalize">
          {r.status}
        </Badge>
      ),
    },
    { key: 'redeemedAt', header: 'Redeemed at', render: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.redeemedAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Coupon Redemptions</h1>
        <p className="text-sm text-muted-foreground">The permanent record of every coupon use - cancellations/refunds close a row, never delete it.</p>
      </div>

      <DataTable
        columns={columns}
        data={redemptions}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        toolbarActions={
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No redemptions yet"
        emptyDescription="Coupon redemptions will appear here once customers start using them at checkout."
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
