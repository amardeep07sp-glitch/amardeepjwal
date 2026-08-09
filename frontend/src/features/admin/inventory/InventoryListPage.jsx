import { useRef, useState } from 'react';
import { Eye, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { downloadFile } from '@/lib/downloadFile';
import { useInventoryList, useImportInventorySettings } from './inventoryApi';
import { useAllWarehouses } from './warehousesApi';
import { STOCK_STATUSES, STOCK_STATUS_BADGE_VARIANTS } from './inventorySchema';
import { InventoryDetailDrawer } from './InventoryDetailDrawer';

const STATUS_FILTER_ALL = 'all';
const WAREHOUSE_FILTER_ALL = 'all';

export default function InventoryListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [warehouseFilter, setWarehouseFilter] = useState(WAREHOUSE_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedInventoryId, setSelectedInventoryId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);
  const importSettings = useImportInventorySettings();

  const { data: warehousesData } = useAllWarehouses();
  const { data, isLoading, error, refetch } = useInventoryList({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    stockStatus: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    warehouse: warehouseFilter === WAREHOUSE_FILTER_ALL ? undefined : warehouseFilter,
    sortBy,
    sortOrder,
  });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };
  const warehouses = warehousesData ?? [];

  const handleSortChange = (field) => {
    if (sortBy === field) setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadFile('/inventory/export', { filename: `inventory-export-${Date.now()}.csv` });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const { data: result } = await importSettings.mutateAsync(file);
      toast.success(`Import complete: ${result.updated} updated, ${result.skipped} skipped`);
      if (result.errors?.length) {
        toast.warning(`${result.errors.length} row(s) had issues — first: ${result.errors[0].message}`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'sku', header: 'SKU', sortKey: 'sku' },
    { key: 'product', header: 'Product', render: (row) => row.product?.name ?? '—' },
    { key: 'variant', header: 'Variant', render: (row) => row.variant?.sku ?? '—' },
    { key: 'warehouse', header: 'Warehouse', render: (row) => row.warehouse?.name ?? '—' },
    { key: 'availableQuantity', header: 'Available', sortKey: 'availableQuantity' },
    { key: 'reservedQuantity', header: 'Reserved' },
    {
      key: 'stockStatus',
      header: 'Status',
      sortKey: 'stockStatus',
      render: (row) => (
        <Badge variant={STOCK_STATUS_BADGE_VARIANTS[row.stockStatus]} className="capitalize">
          {row.stockStatus.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-16',
      render: (row) => (
        <Button variant="ghost" size="icon-sm" aria-label={`View ${row.sku}`} onClick={() => setSelectedInventoryId(row.id)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Inventory</h1>
          <p className="text-sm text-muted-foreground">Every stock record across every warehouse, at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFileSelected}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importSettings.isPending}>
            <Upload />
            {importSettings.isPending ? 'Importing...' : 'Import settings'}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(row) => row.id}
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
          <div className="flex flex-wrap gap-2">
            <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WAREHOUSE_FILTER_ALL}>All warehouses</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
                {STOCK_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="No inventory records yet"
        emptyDescription="Inventory records are created automatically when you add a product."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <InventoryDetailDrawer
        inventoryId={selectedInventoryId}
        open={Boolean(selectedInventoryId)}
        onOpenChange={(open) => !open && setSelectedInventoryId(null)}
      />
    </div>
  );
}
