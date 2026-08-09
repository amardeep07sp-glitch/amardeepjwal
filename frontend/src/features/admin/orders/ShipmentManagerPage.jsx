import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useShipments, useMarkShipmentDelivered } from './orderShipmentsApi';
import { SHIPMENT_STATUS_BADGE_VARIANTS } from './orderSchema';

const STATUS_FILTER_ALL = 'all';

export default function ShipmentManagerPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useShipments({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: status === STATUS_FILTER_ALL ? undefined : status,
  });
  const markDelivered = useMarkShipmentDelivered();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleDeliver = async (id) => {
    try {
      await markDelivered.mutateAsync(id);
      toast.success('Shipment delivered');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'shipmentNumber', header: 'Shipment #' },
    { key: 'order', header: 'Order', render: (s) => s.order?.orderNumber ?? '—' },
    { key: 'courier', header: 'Courier', render: (s) => s.courier || '—' },
    { key: 'trackingNumber', header: 'Tracking', render: (s) => s.trackingNumber || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <Badge variant={SHIPMENT_STATUS_BADGE_VARIANTS[s.status]} className="capitalize">
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-32',
      render: (s) => (
        <div className="flex items-center gap-1">
          {s.status !== 'delivered' && (
            <Button size="sm" variant="outline" onClick={() => handleDeliver(s.id)}>
              Deliver
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" aria-label="View order" onClick={() => navigate(`/admin/orders/${s.order?.id}`)}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Shipments</h1>
        <p className="text-sm text-muted-foreground">Every dispatched shipment across every order.</p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        toolbarActions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="No shipments yet"
        emptyDescription="Shipments created from an order's detail page will show up here."
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
