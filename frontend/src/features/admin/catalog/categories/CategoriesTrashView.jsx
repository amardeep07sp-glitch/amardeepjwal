import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useTrashedCategories, useRestoreCategory, usePermanentlyDeleteCategory } from './categoriesApi';

export function CategoriesTrashView() {
  const [page, setPage] = useState(1);
  const [categoryToPurge, setCategoryToPurge] = useState(null);

  const { data, isLoading, error, refetch } = useTrashedCategories({ page, limit: DEFAULT_PAGE_SIZE });
  const restoreCategory = useRestoreCategory();
  const permanentlyDeleteCategory = usePermanentlyDeleteCategory();

  const categories = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleRestore = async (category) => {
    try {
      await restoreCategory.mutateAsync(category.id);
      toast.success(`"${category.name}" restored`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePurgeConfirm = async () => {
    try {
      await permanentlyDeleteCategory.mutateAsync(categoryToPurge.id);
      toast.success(`"${categoryToPurge.name}" permanently deleted`);
      setCategoryToPurge(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (c) => c.name },
    { key: 'slug', header: 'Slug', render: (c) => <span className="text-muted-foreground">/{c.slug}</span> },
    {
      key: 'deletedAt',
      header: 'Deleted',
      render: (c) => (c.deletedAt ? new Date(c.deletedAt).toLocaleString() : '—'),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-32',
      render: (category) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Restore ${category.name}`} onClick={() => handleRestore(category)}>
            <RotateCcw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Permanently delete ${category.name}`}
            onClick={() => setCategoryToPurge(category)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Deleted categories are kept here until restored or permanently removed.
      </p>

      <DataTable
        columns={columns}
        data={categories}
        rowKey={(category) => category.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="Trash is empty"
        emptyDescription="Categories you delete will show up here until restored or permanently removed."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <ConfirmDialog
        open={Boolean(categoryToPurge)}
        onOpenChange={(open) => !open && setCategoryToPurge(null)}
        title="Permanently delete this category?"
        description={`"${categoryToPurge?.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete permanently"
        variant="destructive"
        isLoading={permanentlyDeleteCategory.isPending}
        onConfirm={handlePurgeConfirm}
      />
    </div>
  );
}
