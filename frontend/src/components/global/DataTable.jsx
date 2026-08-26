import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchInput } from '@/components/global/SearchInput';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Pagination } from '@/components/global/Pagination';
import { cn } from '@/lib/utils';

const DEFAULT_ROW_KEY = (row, index) => row.id ?? row._id ?? index;

function SortableColumnHead({ column, sort }) {
  const isActiveSort = sort.sortBy === column.sortKey;
  const SortIcon = isActiveSort ? (sort.sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => sort.onSortChange(column.sortKey)}
      className={cn(
        'inline-flex items-center gap-1 font-medium hover:text-foreground',
        isActiveSort ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {column.header}
      <SortIcon className="size-3.5" />
    </button>
  );
}

export function DataTable({
  columns,
  data = [],
  rowKey = DEFAULT_ROW_KEY,
  isLoading = false,
  error = null,
  onRetry,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  toolbarActions,
  sort,
  pagination,
  emptyTitle = 'No records found',
  emptyDescription,
}) {
  const showToolbar = onSearchChange || toolbarActions;

  return (
    <div className="flex flex-col gap-4">
      {showToolbar && (
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          {onSearchChange && (
            <SearchInput value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
          )}
          {toolbarActions && <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div>}
        </div>
      )}

      <div className="rounded-card border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.headerClassName}>
                  {column.sortKey && sort ? (
                    <SortableColumnHead column={column} sort={sort} />
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <ErrorState
                    title="Couldn't load data"
                    description={error.message || 'Something went wrong while fetching records.'}
                    actionLabel={onRetry ? 'Retry' : undefined}
                    onAction={onRetry}
                  />
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !error &&
              data.map((row, rowIndex) => (
                <TableRow key={rowKey(row, rowIndex)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.cellClassName}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {pagination && !isLoading && !error && data.length > 0 && <Pagination {...pagination} />}
    </div>
  );
}
