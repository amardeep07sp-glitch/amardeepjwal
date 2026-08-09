import { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useStockAudits, useCompleteStockAudit } from './stockAuditsApi';
import { NewStockAuditModal } from './NewStockAuditModal';

const STATUS_FILTER_ALL = 'all';
const STATUS_BADGE_VARIANTS = { draft: 'warning', completed: 'success' };

export default function AuditManagerPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useStockAudits({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
  });
  const completeAudit = useCompleteStockAudit();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleComplete = async (audit) => {
    try {
      await completeAudit.mutateAsync(audit.id);
      toast.success('Audit completed and ledger updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'sku', header: 'SKU', render: (a) => a.inventory?.sku ?? '—' },
    { key: 'product', header: 'Product', render: (a) => a.inventory?.product?.name ?? '—' },
    { key: 'systemQuantity', header: 'System Qty' },
    { key: 'countedQuantity', header: 'Counted Qty' },
    {
      key: 'difference',
      header: 'Difference',
      render: (a) => (
        <span className={a.difference > 0 ? 'text-success' : a.difference < 0 ? 'text-destructive' : 'text-muted-foreground'}>
          {a.difference > 0 ? '+' : ''}
          {a.difference}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <Badge variant={STATUS_BADGE_VARIANTS[a.status]} className="capitalize">
          {a.status}
        </Badge>
      ),
    },
    { key: 'performedBy', header: 'Performed By', render: (a) => a.performedBy?.name ?? '—' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-16',
      render: (audit) =>
        audit.status === 'draft' ? (
          <Button variant="ghost" size="icon-sm" aria-label="Complete" onClick={() => handleComplete(audit)}>
            <CheckCircle2 className="size-4 text-success" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Stock Audits</h1>
          <p className="text-sm text-muted-foreground">Reconcile physical counts against system stock, with a permanent audit trail.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus />
          New audit
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="No audits yet"
        emptyDescription="Start a stock count to see it here."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <NewStockAuditModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
