import { useState } from 'react';
import { Pencil, Trash2, Copy, Star, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import {
  useVariants,
  useDeleteVariant,
  useBulkDeleteVariants,
  useBulkUpdateVariantStatus,
  useBulkDuplicateVariants,
} from './variantsApi';
import { VariantEditModal } from './VariantEditModal';
import { CATALOG_STATUSES, STATUS_BADGE_VARIANTS, describeAttributes } from './variantSchema';

const STATUS_FILTER_ALL = 'all';

export function VariantTable({ productId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, error, refetch } = useVariants(productId, {
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    sortBy,
    sortOrder,
  });
  const deleteVariant = useDeleteVariant(productId);
  const bulkDeleteVariants = useBulkDeleteVariants(productId);
  const bulkUpdateStatus = useBulkUpdateVariantStatus(productId);
  const bulkDuplicateVariants = useBulkDuplicateVariants(productId);

  const variants = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };
  const allVisibleSelected = variants.length > 0 && variants.every((v) => selectedIds.includes(v.id));

  const toggleSelectAll = () => setSelectedIds(allVisibleSelected ? [] : variants.map((v) => v.id));
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
      await deleteVariant.mutateAsync(variantToDelete.id);
      toast.success('Variant deleted successfully');
      setVariantToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteVariants.mutateAsync(selectedIds);
      toast.success(`${selectedIds.length} variants deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      await bulkUpdateStatus.mutateAsync({ ids: selectedIds, status });
      toast.success(`${selectedIds.length} variants updated successfully`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDuplicate = async () => {
    try {
      const created = await bulkDuplicateVariants.mutateAsync(selectedIds);
      toast.success(`Duplicated ${created.length} variant(s) - assign attributes to activate them`);
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
      render: (v) => (
        <Checkbox checked={selectedIds.includes(v.id)} onCheckedChange={() => toggleSelectOne(v.id)} aria-label={`Select ${v.sku}`} />
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      sortKey: 'sku',
      render: (v) => (
        <span className="flex items-center gap-1.5">
          {v.sku}
          {v.isDefault && <ShieldCheck className="size-3.5 text-primary" aria-label="Default variant" />}
          {v.isFeatured && <Star className="size-3.5 fill-warning text-warning" />}
        </span>
      ),
    },
    {
      key: 'combination',
      header: 'Combination',
      render: (v) =>
        v.attributes.length > 0 ? (
          describeAttributes(v.attributes)
        ) : (
          <span className="text-muted-foreground italic">Unassigned</span>
        ),
    },
    {
      key: 'priceOverride',
      header: 'Price override',
      render: (v) => (v.priceOverride != null ? v.priceOverride : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => (
        <Badge variant={STATUS_BADGE_VARIANTS[v.status]} className="capitalize">
          {v.status}
        </Badge>
      ),
    },
    { key: 'order', header: 'Order', sortKey: 'order' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (variant) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${variant.sku}`} onClick={() => setEditingVariant(variant)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${variant.sku}`} onClick={() => setVariantToDelete(variant)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
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
          <Button variant="outline" size="sm" onClick={handleBulkDuplicate}>
            <Copy />
            Duplicate
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={variants}
        rowKey={(v) => v.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by SKU..."
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
        emptyTitle="No variants yet"
        emptyDescription="Use the generator above to create variants from your attributes."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <VariantEditModal
        open={Boolean(editingVariant)}
        onOpenChange={(open) => !open && setEditingVariant(null)}
        productId={productId}
        variant={editingVariant}
      />

      <ConfirmDialog
        open={Boolean(variantToDelete)}
        onOpenChange={(open) => !open && setVariantToDelete(null)}
        title="Delete this variant?"
        description={`"${variantToDelete?.sku}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteVariant.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.length} variants?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={bulkDeleteVariants.isPending}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
