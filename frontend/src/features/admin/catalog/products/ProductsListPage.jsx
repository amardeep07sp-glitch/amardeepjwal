import { useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Eye, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useCategoryTree } from '../categories/categoriesApi';
import { flattenTreeForParentOptions } from '../categories/categoryTreeOptions';
import {
  useProducts,
  useDeleteProduct,
  useBulkDeleteProducts,
  useBulkUpdateProductStatus,
  useDuplicateProduct,
} from './productsApi';
import { ProductFormModal } from './ProductFormModal';
import { ProductPreviewDrawer } from './ProductPreviewDrawer';
import { CATALOG_STATUSES, STATUS_BADGE_VARIANTS } from './productSchema';

const STATUS_FILTER_ALL = 'all';
const CATEGORY_FILTER_ALL = 'all';

export default function ProductsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [categoryFilter, setCategoryFilter] = useState(CATEGORY_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [formModalState, setFormModalState] = useState({ open: false, product: null });
  const [previewProduct, setPreviewProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: categoryTree = [] } = useCategoryTree();
  const categoryOptions = flattenTreeForParentOptions(categoryTree, undefined);

  const { data, isLoading, error, refetch } = useProducts({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    category: categoryFilter === CATEGORY_FILTER_ALL ? undefined : categoryFilter,
    sortBy,
    sortOrder,
  });
  const deleteProduct = useDeleteProduct();
  const bulkDeleteProducts = useBulkDeleteProducts();
  const bulkUpdateStatus = useBulkUpdateProductStatus();
  const duplicateProduct = useDuplicateProduct();

  const products = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };
  const allVisibleSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => setSelectedIds(allVisibleSelected ? [] : products.map((p) => p.id));
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
      await deleteProduct.mutateAsync(productToDelete.id);
      toast.success('Product deleted successfully');
      setProductToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteProducts.mutateAsync(selectedIds);
      toast.success(`${selectedIds.length} products deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      await bulkUpdateStatus.mutateAsync({ ids: selectedIds, status });
      toast.success(`${selectedIds.length} products updated successfully`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDuplicate = async (product) => {
    try {
      await duplicateProduct.mutateAsync(product.id);
      toast.success(`Duplicated "${product.name}"`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'select',
      header: <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />,
      headerClassName: 'w-10',
      render: (p) => (
        <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSelectOne(p.id)} aria-label={`Select ${p.name}`} />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (p) => (
        <span className="flex items-center gap-1.5">
          {p.name}
          {p.isFeatured && <Star className="size-3.5 fill-warning text-warning" />}
        </span>
      ),
    },
    { key: 'sku', header: 'SKU', sortKey: 'sku' },
    { key: 'category', header: 'Category', render: (p) => p.category?.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge variant={STATUS_BADGE_VARIANTS[p.status]} className="capitalize">
          {p.status}
        </Badge>
      ),
    },
    { key: 'order', header: 'Order', sortKey: 'order' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-32',
      render: (product) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Preview ${product.name}`} onClick={() => setPreviewProduct(product)}>
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${product.name}`} onClick={() => setFormModalState({ open: true, product })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Duplicate ${product.name}`} onClick={() => handleDuplicate(product)}>
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${product.name}`} onClick={() => setProductToDelete(product)}>
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
          <h1 className="text-h4 font-semibold text-heading">Products</h1>
          <p className="text-sm text-muted-foreground">Core product catalog - pricing, inventory, and media come later.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, product: null })}>
          <Plus />
          New product
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
        data={products}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name or SKU..."
        sort={{ sortBy, sortOrder, onSortChange: handleSortChange }}
        toolbarActions={
          <>
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
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CATEGORY_FILTER_ALL}>All categories</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {'—'.repeat(option.depth)} {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="No products yet"
        emptyDescription="Create your first product to start building the catalog."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <ProductFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, product: open ? formModalState.product : null })}
        product={formModalState.product}
      />

      <ProductPreviewDrawer
        open={Boolean(previewProduct)}
        onOpenChange={(open) => !open && setPreviewProduct(null)}
        product={previewProduct}
      />

      <ConfirmDialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title="Delete this product?"
        description={`"${productToDelete?.name}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteProduct.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.length} products?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={bulkDeleteProducts.isPending}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
