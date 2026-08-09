import { useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useBarcodes, useRegenerateBarcode, useDeleteBarcode } from './barcodesApi';
import { GenerateBarcodeModal } from './GenerateBarcodeModal';
import { BarcodeImage } from './BarcodeImage';

const STATUS_FILTER_ALL = 'all';
const STATUS_BADGE_VARIANTS = { active: 'success', inactive: 'secondary' };

export default function BarcodeManagerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewBarcode, setPreviewBarcode] = useState(null);
  const [barcodeToDelete, setBarcodeToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useBarcodes({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
  });
  const regenerateBarcode = useRegenerateBarcode();
  const deleteBarcode = useDeleteBarcode();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleRegenerate = async (barcode) => {
    try {
      await regenerateBarcode.mutateAsync({
        productId: barcode.product?.id ?? null,
        variantId: barcode.variant?.id ?? null,
        barcodeType: barcode.barcodeType,
      });
      toast.success('Barcode regenerated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBarcode.mutateAsync(barcodeToDelete.id);
      toast.success('Barcode deleted successfully');
      setBarcodeToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'preview',
      header: '',
      headerClassName: 'w-20',
      render: (b) => (
        <button type="button" onClick={() => setPreviewBarcode(b)} className="block">
          <BarcodeImage barcodeType={b.barcodeType} barcodeValue={b.barcodeValue} className="h-10 w-16" />
        </button>
      ),
    },
    { key: 'barcodeValue', header: 'Value' },
    { key: 'barcodeType', header: 'Type', render: (b) => <span className="uppercase">{b.barcodeType}</span> },
    { key: 'product', header: 'Product', render: (b) => b.product?.name ?? b.variant?.sku ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <Badge variant={STATUS_BADGE_VARIANTS[b.status]} className="capitalize">
          {b.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (barcode) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Regenerate" onClick={() => handleRegenerate(barcode)}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setBarcodeToDelete(barcode)}>
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
          <h1 className="text-h4 font-semibold text-heading">Barcodes</h1>
          <p className="text-sm text-muted-foreground">Generate and manage scannable product barcodes.</p>
        </div>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus />
          Generate barcode
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by barcode value..."
        toolbarActions={
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyTitle="No barcodes yet"
        emptyDescription="Generate your first barcode to start printing labels."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <GenerateBarcodeModal open={generateOpen} onOpenChange={setGenerateOpen} />

      {previewBarcode && (
        <ConfirmDialog
          open={Boolean(previewBarcode)}
          onOpenChange={(open) => !open && setPreviewBarcode(null)}
          title={previewBarcode.barcodeValue}
          description={
            <div className="flex justify-center py-4">
              <BarcodeImage barcodeType={previewBarcode.barcodeType} barcodeValue={previewBarcode.barcodeValue} />
            </div>
          }
          confirmLabel="Close"
          onConfirm={() => setPreviewBarcode(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(barcodeToDelete)}
        onOpenChange={(open) => !open && setBarcodeToDelete(null)}
        title="Delete this barcode?"
        description="This fails if any inventory record still references it."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteBarcode.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
