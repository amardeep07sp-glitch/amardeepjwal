import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useAttributeGroups, useDeleteAttributeGroup } from './attributeGroupsApi';
import { AttributeGroupFormModal } from './AttributeGroupFormModal';

export default function AttributeGroupsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formModalState, setFormModalState] = useState({ open: false, group: null });
  const [groupToDelete, setGroupToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useAttributeGroups({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    sortBy,
    sortOrder,
  });
  const deleteGroup = useDeleteAttributeGroup();

  const groups = data?.items ?? [];
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
      await deleteGroup.mutateAsync(groupToDelete.id);
      toast.success('Attribute group deleted successfully');
      setGroupToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', sortKey: 'name' },
    { key: 'slug', header: 'Slug', render: (g) => <span className="text-muted-foreground">/{g.slug}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (g) => (
        <Badge variant={g.status === 'active' ? 'success' : 'secondary'} className="capitalize">
          {g.status}
        </Badge>
      ),
    },
    { key: 'order', header: 'Order', sortKey: 'order' },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (group) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${group.name}`} onClick={() => setFormModalState({ open: true, group })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${group.name}`} onClick={() => setGroupToDelete(group)}>
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
          <h1 className="text-h4 font-semibold text-heading">Attribute Groups</h1>
          <p className="text-sm text-muted-foreground">Organize product attributes into logical groups.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, group: null })}>
          <Plus />
          New group
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={groups}
        rowKey={(g) => g.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search groups..."
        sort={{ sortBy, sortOrder, onSortChange: handleSortChange }}
        emptyTitle="No attribute groups yet"
        emptyDescription="Create groups like Metal, Purity, or Stone to organize attributes."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <AttributeGroupFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, group: open ? formModalState.group : null })}
        group={formModalState.group}
      />

      <ConfirmDialog
        open={Boolean(groupToDelete)}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
        title="Delete this attribute group?"
        description={`"${groupToDelete?.name}" can't be deleted while attributes are attached to it.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteGroup.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
