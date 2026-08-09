import { useState } from 'react';
import { Plus, Pencil, Trash2, ListTree } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useAttributes, useDeleteAttribute } from './attributesApi';
import { AttributeFormModal } from './AttributeFormModal';
import { ATTRIBUTE_TYPES, VALUE_BACKED_TYPES } from './attributeSchema';
import { AttributeValuesDrawer } from '../attribute-values/AttributeValuesDrawer';

const TYPE_FILTER_ALL = 'all';

export default function AttributesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(TYPE_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formModalState, setFormModalState] = useState({ open: false, attribute: null });
  const [attributeToDelete, setAttributeToDelete] = useState(null);
  const [valuesDrawerAttribute, setValuesDrawerAttribute] = useState(null);

  const { data, isLoading, error, refetch } = useAttributes({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    type: typeFilter === TYPE_FILTER_ALL ? undefined : typeFilter,
    sortBy,
    sortOrder,
  });
  const deleteAttribute = useDeleteAttribute();

  const attributes = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleSortChange = (field) => {
    if (sortBy === field) setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAttribute.mutateAsync(attributeToDelete.id);
      toast.success('Attribute deleted successfully');
      setAttributeToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', sortKey: 'name' },
    { key: 'group', header: 'Group', render: (a) => a.group?.name ?? '—' },
    { key: 'type', header: 'Type', render: (a) => <Badge variant="outline" className="capitalize">{a.type}</Badge> },
    {
      key: 'flags',
      header: 'Flags',
      render: (a) => (
        <div className="flex gap-1">
          {a.isRequired && <Badge variant="secondary">Required</Badge>}
          {a.isFilterable && <Badge variant="secondary">Filterable</Badge>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <Badge variant={a.status === 'active' ? 'success' : 'secondary'} className="capitalize">
          {a.status}
        </Badge>
      ),
    },
    { key: 'order', header: 'Order', sortKey: 'order' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-28',
      render: (attribute) => (
        <div className="flex items-center gap-1">
          {VALUE_BACKED_TYPES.includes(attribute.type) && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Manage values for ${attribute.name}`}
              onClick={() => setValuesDrawerAttribute(attribute)}
            >
              <ListTree className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${attribute.name}`} onClick={() => setFormModalState({ open: true, attribute })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${attribute.name}`} onClick={() => setAttributeToDelete(attribute)}>
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
          <h1 className="text-h4 font-semibold text-heading">Attributes</h1>
          <p className="text-sm text-muted-foreground">Define the dynamic attributes products can use.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, attribute: null })}>
          <Plus />
          New attribute
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={attributes}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search attributes..."
        sort={{ sortBy, sortOrder, onSortChange: handleSortChange }}
        toolbarActions={
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TYPE_FILTER_ALL}>All types</SelectItem>
              {ATTRIBUTE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No attributes yet"
        emptyDescription="Create attributes like Size, Weight, or Purity for your products."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <AttributeFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, attribute: open ? formModalState.attribute : null })}
        attribute={formModalState.attribute}
      />

      <AttributeValuesDrawer
        open={Boolean(valuesDrawerAttribute)}
        onOpenChange={(open) => !open && setValuesDrawerAttribute(null)}
        attribute={valuesDrawerAttribute}
      />

      <ConfirmDialog
        open={Boolean(attributeToDelete)}
        onOpenChange={(open) => !open && setAttributeToDelete(null)}
        title="Delete this attribute?"
        description={`"${attributeToDelete?.name}" can't be deleted while values are attached to it.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteAttribute.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
