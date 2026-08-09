import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useCategoryActivity } from './categoriesApi';

// Matches the action strings category.service.js passes to
// activityLogService.record - keep in sync if the backend adds a new one.
const ACTION_LABELS = {
  create: 'Created',
  update: 'Updated',
  status_change: 'Status changed',
  reorder: 'Reordered',
  delete: 'Moved to trash',
  restore: 'Restored',
  permanent_delete: 'Permanently deleted',
  bulk_delete: 'Bulk: moved to trash',
  bulk_status_change: 'Bulk: status changed',
  duplicate: 'Duplicated',
  import: 'CSV import',
};

export function CategoriesActivityView() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useCategoryActivity({ page, limit: DEFAULT_PAGE_SIZE });

  const logs = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    {
      key: 'action',
      header: 'Action',
      render: (log) => <Badge variant="outline">{ACTION_LABELS[log.action] ?? log.action}</Badge>,
    },
    { key: 'entityName', header: 'Category', render: (log) => log.entityName || '—' },
    { key: 'performedBy', header: 'By', render: (log) => log.performedBy?.name ?? 'System' },
    { key: 'createdAt', header: 'When', render: (log) => new Date(log.createdAt).toLocaleString() },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">A running audit trail of every change made to categories.</p>

      <DataTable
        columns={columns}
        data={logs}
        rowKey={(log) => log.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No activity yet"
        emptyDescription="Changes to categories will show up here."
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
