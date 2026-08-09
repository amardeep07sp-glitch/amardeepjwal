import { useState } from 'react';

import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useCategoryAnalytics } from './categoriesApi';

export function CategoriesAnalyticsView() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('viewCount');

  const { data, isLoading, error, refetch } = useCategoryAnalytics({ page, limit: DEFAULT_PAGE_SIZE, sortBy });

  const rows = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleSortChange = (field) => setSortBy(field);

  const columns = [
    { key: 'name', header: 'Category', render: (row) => row.name },
    { key: 'productCount', header: 'Products' },
    { key: 'viewCount', header: 'Views', sortKey: 'viewCount' },
    { key: 'clickCount', header: 'Clicks', sortKey: 'clickCount' },
    {
      key: 'clickThroughRate',
      header: 'CTR',
      render: (row) => `${(row.clickThroughRate * 100).toFixed(1)}%`,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Views are recorded when a customer opens a category page; clicks when they tap into it from a listing.
        "Trending" on the storefront is driven by this same view data.
      </p>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        sort={{ sortBy, sortOrder: 'desc', onSortChange: handleSortChange }}
        emptyTitle="No data yet"
        emptyDescription="Analytics will show up once customers start browsing the storefront."
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
