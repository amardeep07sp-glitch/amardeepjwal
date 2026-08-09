import { useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useWarehouses, useDeleteWarehouse, useSetDefaultWarehouse } from './warehousesApi';
import { WarehouseFormModal } from './WarehouseFormModal';
import { WAREHOUSE_STATUSES, STATUS_BADGE_VARIANTS } from './warehouseSchema';

const STATUS_FILTER_ALL = 'all';

export default function WarehousesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formModalState, setFormModalState] = useState({ open: false, warehouse: null });
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useWarehouses({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    sortBy,
    sortOrder,
  });
  const deleteWarehouse = useDeleteWarehouse();
  const setDefaultWarehouse = useSetDefaultWarehouse();

  const warehouses = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleSortChange = (field) => {
    if (sortBy === field) setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteWarehouse.mutateAsync(warehouseToDelete.id);
      toast.success('Warehouse deleted successfully');
      setWarehouseToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSetDefault = async (warehouse) => {
    try {
      await setDefaultWarehouse.mutateAsync(warehouse.id);
      toast.success(`"${warehouse.name}" is now the default warehouse`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (w) => (
        <span className="flex items-center gap-1.5">
          {w.name}
          {w.isDefault && <Star className="size-3.5 fill-warning text-warning" />}
        </span>
      ),
    },
    { key: 'code', header: 'Code', sortKey: 'code' },
    { key: 'contactPerson', header: 'Contact' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'status',
      header: 'Status',
      render: (w) => (
        <Badge variant={STATUS_BADGE_VARIANTS[w.status]} className="capitalize">
          {w.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-32',
      render: (warehouse) => (
        <div className="flex items-center gap-1">
          {!warehouse.isDefault && (
            <Button variant="ghost" size="sm" onClick={() => handleSetDefault(warehouse)}>
              Set default
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${warehouse.name}`} onClick={() => setFormModalState({ open: true, warehouse })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${warehouse.name}`} onClick={() => setWarehouseToDelete(warehouse)}>
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
          <h1 className="text-h4 font-semibold text-heading">Warehouses</h1>
          <p className="text-sm text-muted-foreground">Manage stock locations across your business.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, warehouse: null })}>
          <Plus />
          New warehouse
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        rowKey={(w) => w.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search warehouses..."
        sort={{ sortBy, sortOrder, onSortChange: handleSortChange }}
        toolbarActions={
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {WAREHOUSE_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No warehouses yet"
        emptyDescription="Create your first warehouse to start tracking stock."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <WarehouseFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, warehouse: open ? formModalState.warehouse : null })}
        warehouse={formModalState.warehouse}
      />

      <ConfirmDialog
        open={Boolean(warehouseToDelete)}
        onOpenChange={(open) => !open && setWarehouseToDelete(null)}
        title="Delete this warehouse?"
        description={`"${warehouseToDelete?.name}" will be permanently removed. This fails if any inventory records still reference it.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteWarehouse.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
