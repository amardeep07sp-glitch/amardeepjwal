import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { downloadFile } from '@/lib/downloadFile';
import { useCustomers } from './customersApi';
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_BADGE_VARIANTS, CUSTOMER_TYPE_LABELS } from './customerSchema';
import { CustomerFormModal } from './CustomerFormModal';

const STATUS_FILTER_ALL = 'all';

export default function CustomersListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error, refetch } = useCustomers({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: status === STATUS_FILTER_ALL ? undefined : status,
  });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadFile('/customers/export?format=csv', { filename: `customers-export-${Date.now()}.csv` });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const columns = [
    { key: 'customerCode', header: 'Code' },
    { key: 'name', header: 'Name', render: (c) => c.displayName },
    { key: 'contact', header: 'Contact', render: (c) => c.phone || c.email || '—' },
    { key: 'customerType', header: 'Type', render: (c) => CUSTOMER_TYPE_LABELS[c.customerType] ?? c.customerType },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge variant={CUSTOMER_STATUS_BADGE_VARIANTS[c.status]} className="capitalize">
          {CUSTOMER_STATUS_LABELS[c.status] ?? c.status}
        </Badge>
      ),
    },
    { key: 'segments', header: 'Segments', render: (c) => c.segments?.map((s) => s.name).join(', ') || '—' },
    { key: 'createdAt', header: 'Joined', render: (c) => new Date(c.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (c) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(c)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="View" onClick={() => navigate(`/admin/customers/${c.id}`)}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Customers</h1>
          <p className="text-sm text-muted-foreground">Every customer relationship, in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={openCreate}>
            <Plus />
            New customer
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, phone, email, code, GST..."
        toolbarActions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No customers yet"
        emptyDescription="Add your first customer to see them here."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <CustomerFormModal open={modalOpen} onOpenChange={setModalOpen} customer={editingCustomer} />
    </div>
  );
}
