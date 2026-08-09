import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { downloadFile } from '@/lib/downloadFile';
import { useOrders } from './ordersApi';
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_VARIANTS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_BADGE_VARIANTS } from './orderSchema';
import { NewOrderModal } from './NewOrderModal';

const STATUS_FILTER_ALL = 'all';

export default function OrdersListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatus, setOrderStatus] = useState(STATUS_FILTER_ALL);
  const [paymentStatus, setPaymentStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error, refetch } = useOrders({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    orderStatus: orderStatus === STATUS_FILTER_ALL ? undefined : orderStatus,
    paymentStatus: paymentStatus === STATUS_FILTER_ALL ? undefined : paymentStatus,
  });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadFile('/orders/export?format=csv', { filename: `orders-export-${Date.now()}.csv` });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'customer', header: 'Customer', render: (o) => o.customer?.name ?? '—' },
    {
      key: 'orderStatus',
      header: 'Status',
      render: (o) => (
        <Badge variant={ORDER_STATUS_BADGE_VARIANTS[o.orderStatus]} className="capitalize">
          {ORDER_STATUS_LABELS[o.orderStatus] ?? o.orderStatus}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (o) => (
        <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[o.paymentStatus]} className="capitalize">
          {PAYMENT_STATUS_LABELS[o.paymentStatus] ?? o.paymentStatus}
        </Badge>
      ),
    },
    { key: 'grandTotal', header: 'Total', render: (o) => `${o.currency} ${o.grandTotal.toFixed(2)}` },
    { key: 'source', header: 'Source', render: (o) => <span className="capitalize">{o.source}</span> },
    { key: 'createdAt', header: 'Date', render: (o) => new Date(o.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-16',
      render: (o) => (
        <Button variant="ghost" size="icon-sm" aria-label={`View ${o.orderNumber}`} onClick={() => navigate(`/admin/orders/${o.id}`)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Orders</h1>
          <p className="text-sm text-muted-foreground">Every order across every sales channel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus />
            New order
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by order #, SKU..."
        toolbarActions={
          <div className="flex gap-2">
            <Select value={orderStatus} onValueChange={(v) => { setOrderStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
                {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All payments</SelectItem>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="No orders yet"
        emptyDescription="Create your first order to see it here."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <NewOrderModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
