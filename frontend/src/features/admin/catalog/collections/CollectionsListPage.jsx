import { useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import {
  useCollections,
  useDeleteCollection,
  useBulkDeleteCollections,
  useBulkUpdateCollectionStatus,
  useDuplicateCollection,
} from './collectionsApi';
import { CollectionFormModal } from './CollectionFormModal';
import { CATALOG_STATUSES, STATUS_BADGE_VARIANTS, COLLECTION_TYPE_OPTIONS } from './collectionSchema';

const STATUS_FILTER_ALL = 'all';
const TYPE_FILTER_ALL = 'all';

export default function CollectionsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [typeFilter, setTypeFilter] = useState(TYPE_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [formModalState, setFormModalState] = useState({ open: false, collection: null });
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, error, refetch } = useCollections({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    type: typeFilter === TYPE_FILTER_ALL ? undefined : typeFilter,
    sortBy,
    sortOrder,
  });
  const deleteCollection = useDeleteCollection();
  const bulkDeleteCollections = useBulkDeleteCollections();
  const bulkUpdateStatus = useBulkUpdateCollectionStatus();
  const duplicateCollection = useDuplicateCollection();

  const collections = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };
  const allVisibleSelected = collections.length > 0 && collections.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => setSelectedIds(allVisibleSelected ? [] : collections.map((c) => c.id));
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
      await deleteCollection.mutateAsync(collectionToDelete.id);
      toast.success('Collection deleted successfully');
      setCollectionToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteCollections.mutateAsync(selectedIds);
      toast.success(`${selectedIds.length} collections deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      await bulkUpdateStatus.mutateAsync({ ids: selectedIds, status });
      toast.success(`${selectedIds.length} collections updated successfully`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDuplicate = async (collection) => {
    try {
      await duplicateCollection.mutateAsync(collection.id);
      toast.success(`Duplicated "${collection.name}"`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'select',
      header: <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />,
      headerClassName: 'w-10',
      render: (c) => (
        <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggleSelectOne(c.id)} aria-label={`Select ${c.name}`} />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (c) => (
        <span className="flex items-center gap-1.5">
          {c.name}
          {c.isFeatured && <Star className="size-3.5 fill-warning text-warning" />}
        </span>
      ),
    },
    { key: 'slug', header: 'Slug', render: (c) => <span className="text-muted-foreground">/{c.slug}</span> },
    {
      key: 'type',
      header: 'Type',
      render: (c) => (
        <Badge variant="outline" className="capitalize">
          {COLLECTION_TYPE_OPTIONS.find((opt) => opt.value === c.type)?.label ?? c.type}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge variant={STATUS_BADGE_VARIANTS[c.status]} className="capitalize">
          {c.status}
        </Badge>
      ),
    },
    { key: 'order', header: 'Order', sortKey: 'order' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-28',
      render: (collection) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${collection.name}`} onClick={() => setFormModalState({ open: true, collection })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Duplicate ${collection.name}`} onClick={() => handleDuplicate(collection)}>
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${collection.name}`} onClick={() => setCollectionToDelete(collection)}>
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
          <h1 className="text-h4 font-semibold text-heading">Collections</h1>
          <p className="text-sm text-muted-foreground">Curate products into themed collections.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, collection: null })}>
          <Plus />
          New collection
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
        data={collections}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search collections..."
        sort={{ sortBy, sortOrder, onSortChange: handleSortChange }}
        toolbarActions={
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TYPE_FILTER_ALL}>All types</SelectItem>
                {COLLECTION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-35">
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
          </div>
        }
        emptyTitle="No collections yet"
        emptyDescription="Create your first collection to start curating products."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <CollectionFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, collection: open ? formModalState.collection : null })}
        collection={formModalState.collection}
      />

      <ConfirmDialog
        open={Boolean(collectionToDelete)}
        onOpenChange={(open) => !open && setCollectionToDelete(null)}
        title="Delete this collection?"
        description={`"${collectionToDelete?.name}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteCollection.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.length} collections?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={bulkDeleteCollections.isPending}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
