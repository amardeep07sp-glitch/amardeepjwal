import { useState } from 'react';
import { Pencil, Trash2, Copy, Eye, CornerDownRight, Star, GitMerge } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import {
  useCategories,
  useDeleteCategory,
  useBulkDeleteCategories,
  useBulkUpdateCategoryStatus,
  useDuplicateCategory,
} from './categoriesApi';
import { CATEGORY_STATUSES } from './categorySchema';
import { STATUS_BADGE_VARIANTS } from './categoryStatusMeta';
import { MergeCategoryDialog } from './MergeCategoryDialog';

const STATUS_FILTER_ALL = 'all';

export function CategoriesTableView({ onEdit, onPreview }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryToMerge, setCategoryToMerge] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, error, refetch } = useCategories({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    sortBy,
    sortOrder,
  });
  const deleteCategory = useDeleteCategory();
  const bulkDeleteCategories = useBulkDeleteCategories();
  const bulkUpdateStatus = useBulkUpdateCategoryStatus();
  const duplicateCategory = useDuplicateCategory();

  const categories = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const allVisibleSelected = categories.length > 0 && categories.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : categories.map((c) => c.id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast.success('Category moved to trash');
      setCategoryToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteCategories.mutateAsync(selectedIds);
      toast.success(`${selectedIds.length} categories moved to trash`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      await bulkUpdateStatus.mutateAsync({ ids: selectedIds, status });
      toast.success(`${selectedIds.length} categories updated successfully`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDuplicate = async (category) => {
    try {
      await duplicateCategory.mutateAsync(category.id);
      toast.success(`Duplicated "${category.name}"`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'select',
      header: (
        <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all rows" />
      ),
      headerClassName: 'w-10',
      render: (category) => (
        <Checkbox
          checked={selectedIds.includes(category.id)}
          onCheckedChange={() => toggleSelectOne(category.id)}
          aria-label={`Select ${category.name}`}
        />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (category) => (
        <span className="flex items-center gap-1.5">
          {category.depth > 0 && <CornerDownRight className="size-3.5 text-muted-foreground" />}
          {category.name}
          {category.isFeatured && <Star className="size-3.5 fill-warning text-warning" />}
        </span>
      ),
    },
    { key: 'slug', header: 'Slug', render: (c) => <span className="text-muted-foreground">/{c.slug}</span> },
    { key: 'parent', header: 'Parent', render: (c) => c.parent?.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge variant={STATUS_BADGE_VARIANTS[c.status]} className="capitalize">
          {c.status}
        </Badge>
      ),
    },
    {
      key: 'productCount',
      header: 'Products',
      render: (c) => (c.productCountRecursive ?? c.productCount ?? 0),
    },
    { key: 'order', header: 'Order', sortKey: 'order' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-32',
      render: (category) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Preview ${category.name}`} onClick={() => onPreview(category)}>
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${category.name}`} onClick={() => onEdit(category)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Duplicate ${category.name}`}
            onClick={() => handleDuplicate(category)}
          >
            <Copy className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Merge ${category.name}`}
            onClick={() => setCategoryToMerge(category)}
          >
            <GitMerge className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${category.name}`}
            onClick={() => setCategoryToDelete(category)}
          >
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
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={categories}
        rowKey={(category) => category.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search categories..."
        sort={{ sortBy, sortOrder, onSortChange: handleSortChange }}
        toolbarActions={
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {CATEGORY_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No categories yet"
        emptyDescription="Create your first category to start organizing products."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Move this category to trash?"
        description={`"${categoryToDelete?.name}" will be moved to trash and can be restored later. Categories with subcategories or assigned products can't be deleted.`}
        confirmLabel="Move to trash"
        variant="destructive"
        isLoading={deleteCategory.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Move ${selectedIds.length} categories to trash?`}
        description="Categories with subcategories outside this selection, or with assigned products, can't be deleted."
        confirmLabel="Move to trash"
        variant="destructive"
        isLoading={bulkDeleteCategories.isPending}
        onConfirm={handleBulkDeleteConfirm}
      />

      <MergeCategoryDialog
        open={Boolean(categoryToMerge)}
        onOpenChange={(open) => !open && setCategoryToMerge(null)}
        sourceCategory={categoryToMerge}
      />
    </div>
  );
}
