import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useCoupons, useDeleteCoupon } from './couponsApi';
import { CouponFormModal } from './CouponFormModal';
import { STATUS_BADGE_VARIANTS } from './couponSchema';

const STATUS_FILTER_ALL = 'all';

const formatDiscount = (coupon) =>
  coupon.discountType === 'percentage'
    ? `${coupon.discountValue}%${coupon.maxDiscountAmount ? ` (up to ₹${coupon.maxDiscountAmount})` : ''}`
    : `₹${coupon.discountValue}`;

const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CouponsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [formModalState, setFormModalState] = useState({ open: false, coupon: null });
  const [couponToDelete, setCouponToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useCoupons({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    isActive: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter === 'active',
  });
  const deleteCoupon = useDeleteCoupon();

  const coupons = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCoupon.mutateAsync(couponToDelete.id);
      toast.success('Coupon deleted successfully');
      setCouponToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (c) => (
        <div>
          <span className="font-mono text-sm font-semibold text-heading">{c.code}</span>
          {c.description && <p className="mt-0.5 max-w-56 truncate text-xs text-muted-foreground">{c.description}</p>}
        </div>
      ),
    },
    { key: 'discount', header: 'Discount', render: (c) => formatDiscount(c) },
    { key: 'minOrderValue', header: 'Min Order', render: (c) => (c.minOrderValue > 0 ? `₹${c.minOrderValue}` : '-') },
    {
      key: 'usage',
      header: 'Usage',
      render: (c) => `${c.redemptionCount}${c.usageLimit ? ` / ${c.usageLimit}` : ''}`,
    },
    {
      key: 'validity',
      header: 'Validity',
      render: (c) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(c.validFrom)} - {formatDate(c.validUntil)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => {
        const now = new Date();
        const expired = new Date(c.validUntil) < now;
        const status = !c.isActive ? 'inactive' : expired ? 'inactive' : 'active';
        return (
          <Badge variant={STATUS_BADGE_VARIANTS[status]} className="capitalize">
            {expired && c.isActive ? 'Expired' : status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (coupon) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${coupon.code}`} onClick={() => setFormModalState({ open: true, coupon })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${coupon.code}`} onClick={() => setCouponToDelete(coupon)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Coupons</h1>
          <p className="text-sm text-muted-foreground">Create and manage discount codes customers can apply at checkout.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, coupon: null })}>
          <Plus />
          New coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by code..."
        toolbarActions={
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="No coupons yet"
        emptyDescription="Create your first coupon to offer a discount at checkout."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <CouponFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, coupon: open ? formModalState.coupon : null })}
        coupon={formModalState.coupon}
      />

      <ConfirmDialog
        open={Boolean(couponToDelete)}
        onOpenChange={(open) => !open && setCouponToDelete(null)}
        title="Delete this coupon?"
        description={`"${couponToDelete?.code}" will be permanently removed. Past orders that used it keep their own recorded discount.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteCoupon.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
