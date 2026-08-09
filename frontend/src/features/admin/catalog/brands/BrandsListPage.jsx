import { useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useBrands, useDeleteBrand, useBulkDeleteBrands, useBulkUpdateBrandStatus } from './brandsApi';
import { BrandFormModal } from './BrandFormModal';
import { CATALOG_STATUSES, STATUS_BADGE_VARIANTS } from './brandSchema';

const STATUS_FILTER_ALL = 'all';

export default function BrandsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [formModalState, setFormModalState] = useState({ open: false, brand: null });
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, error, refetch } = useBrands({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    sortBy,
    sortOrder,
  });
  const deleteBrand = useDeleteBrand();
  const bulkDeleteBrands = useBulkDeleteBrands();
  const bulkUpdateStatus = useBulkUpdateBrandStatus();

  const brands = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };
  const allVisibleSelected = brands.length > 0 && brands.every((b) => selectedIds.includes(b.id));

  const toggleSelectAll = () => setSelectedIds(allVisibleSelected ? [] : brands.map((b) => b.id));
  const toggleSelectOne = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSortChange = (field) => {
    if (sortBy === field) setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBrand.mutateAsync(brandToDelete.id);
      toast.success('Brand deleted successfully');
      setBrandToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteBrands.mutateAsync(selectedIds);
      toast.success(`${selectedIds.length} brands deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      await bulkUpdateStatus.mutateAsync({ ids: selectedIds, status });
      toast.success(`${selectedIds.length} brands updated successfully`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'select',
      header: <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />,
      headerClassName: 'w-10',
      render: (b) => (
        <Checkbox checked={selectedIds.includes(b.id)} onCheckedChange={() => toggleSelectOne(b.id)} aria-label={`Select ${b.name}`} />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (b) => (
        <span className="flex items-center gap-1.5">
          {b.name}
          {b.isFeatured && <Star className="size-3.5 fill-warning text-warning" />}
        </span>
      ),
    },
    { key: 'country', header: 'Country', render: (b) => b.country || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <Badge variant={STATUS_BADGE_VARIANTS[b.status]} className="capitalize">
          {b.status}
        </Badge>
      ),
    },
    { key: 'order', header: 'Order', sortKey: 'order' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (brand) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${brand.name}`} onClick={() => setFormModalState({ open: true, brand })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${brand.name}`} onClick={() => setBrandToDelete(brand)}>
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
          <h1 className="text-h4 font-semibold text-heading">Brands</h1>
          <p className="text-sm text-muted-foreground">Manage the brands carried in your catalog.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, brand: null })}>
          <Plus />
          New brand
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
          <Button variant="success" size="sm" onClick={() => handleBulkStatus('published')}>
            Publish
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkStatus('hidden')}>
            Hide
          </Button>
          <Button variant="warning" size="sm" onClick={() => handleBulkStatus('archived')}>
            Archive
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={brands}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search brands..."
        sort={{ sortBy, sortOrder, onSortChange: handleSortChange }}
        toolbarActions={
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {CATALOG_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No brands yet"
        emptyDescription="Create your first brand to get started."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <BrandFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, brand: open ? formModalState.brand : null })}
        brand={formModalState.brand}
      />

      <ConfirmDialog
        open={Boolean(brandToDelete)}
        onOpenChange={(open) => !open && setBrandToDelete(null)}
        title="Delete this brand?"
        description={`"${brandToDelete?.name}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteBrand.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.length} brands?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={bulkDeleteBrands.isPending}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
