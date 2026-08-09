import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { usePurchaseOrders } from './purchaseOrdersApi';
import { PO_STATUS_LABELS, PO_STATUS_BADGE_VARIANTS, PO_PAYMENT_STATUS_LABELS, PO_PAYMENT_STATUS_BADGE_VARIANTS } from './purchaseSchema';
import { NewPurchaseOrderModal } from './NewPurchaseOrderModal';

const STATUS_FILTER_ALL = 'all';

export default function PurchaseOrdersListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = usePurchaseOrders({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: status === STATUS_FILTER_ALL ? undefined : status,
  });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    { key: 'poNumber', header: 'PO #' },
    { key: 'supplier', header: 'Supplier', render: (po) => po.supplier?.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (po) => (
        <Badge variant={PO_STATUS_BADGE_VARIANTS[po.status]} className="capitalize">
          {PO_STATUS_LABELS[po.status] ?? po.status}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (po) => (
        <Badge variant={PO_PAYMENT_STATUS_BADGE_VARIANTS[po.paymentStatus]} className="capitalize">
          {PO_PAYMENT_STATUS_LABELS[po.paymentStatus] ?? po.paymentStatus}
        </Badge>
      ),
    },
    { key: 'grandTotal', header: 'Total', render: (po) => `₹${po.grandTotal.toFixed(2)}` },
    { key: 'expectedDeliveryDate', header: 'Expected delivery', render: (po) => po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '—' },
    { key: 'createdAt', header: 'Date', render: (po) => new Date(po.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-16',
      render: (po) => (
        <Button variant="ghost" size="icon-sm" aria-label={`View ${po.poNumber}`} onClick={() => navigate(`/admin/purchase-orders/${po.id}`)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Every purchase order across every supplier.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus />
          New purchase order
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(po) => po.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by PO #..."
        toolbarActions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {Object.entries(PO_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No purchase orders yet"
        emptyDescription="Create your first purchase order to see it here."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <NewPurchaseOrderModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
