import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useSuppliers } from './suppliersApi';
import { SUPPLIER_STATUS_LABELS, SUPPLIER_STATUS_BADGE_VARIANTS } from './supplierSchema';
import { SupplierFormModal } from './SupplierFormModal';

const STATUS_FILTER_ALL = 'all';

export default function SuppliersListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useSuppliers({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: status === STATUS_FILTER_ALL ? undefined : status,
  });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    { key: 'supplierCode', header: 'Code' },
    { key: 'name', header: 'Supplier', render: (s) => (
      <div>
        <p className="font-medium text-heading">{s.name}</p>
        {s.contactPerson && <p className="text-xs text-muted-foreground">{s.contactPerson}</p>}
      </div>
    ) },
    { key: 'contact', header: 'Contact', render: (s) => [s.phone, s.email].filter(Boolean).join(' · ') || '—' },
    { key: 'gstNumber', header: 'GST', render: (s) => s.gstNumber || '—' },
    {
      key: 'outstandingBalance',
      header: 'Outstanding',
      render: (s) => (
        <span className={s.outstandingBalance > 0 ? 'font-medium text-warning' : ''}>₹{s.outstandingBalance.toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <Badge variant={SUPPLIER_STATUS_BADGE_VARIANTS[s.status]} className="capitalize">
          {SUPPLIER_STATUS_LABELS[s.status] ?? s.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-16',
      render: (s) => (
        <Button variant="ghost" size="icon-sm" aria-label={`View ${s.name}`} onClick={() => navigate(`/admin/suppliers/${s.id}`)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Every vendor your business purchases from.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus />
          New supplier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, phone, GST..."
        toolbarActions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {Object.entries(SUPPLIER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No suppliers yet"
        emptyDescription="Add your first supplier to start creating purchase orders."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <SupplierFormModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
