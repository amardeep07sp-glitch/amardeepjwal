import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { useNavbarItems, useDeleteNavbarItem } from './navbarApi';
import { NavbarItemFormModal } from './NavbarItemFormModal';

export default function NavbarListPage() {
  const { data: items = [], isLoading, error, refetch } = useNavbarItems();
  const deleteNavbarItem = useDeleteNavbarItem();

  const [formModalState, setFormModalState] = useState({ open: false, item: null });
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteConfirm = async () => {
    try {
      await deleteNavbarItem.mutateAsync(itemToDelete._id);
      toast.success('Navbar item deleted successfully');
      setItemToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'label', header: 'Label' },
    {
      key: 'destination',
      header: 'Links to',
      render: (item) =>
        item.type === 'static_page' ? (item.page?.title ?? 'Untitled page') : item.url,
    },
    { key: 'order', header: 'Order' },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'secondary'}>{item.isActive ? 'Active' : 'Hidden'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${item.label}`}
            onClick={() => setFormModalState({ open: true, item })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${item.label}`}
            onClick={() => setItemToDelete(item)}
          >
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
          <h1 className="text-h4 font-semibold text-heading">Navbar</h1>
          <p className="text-sm text-muted-foreground">Manage the links shown in the site's main navigation.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, item: null })}>
          <Plus />
          New link
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item._id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No navbar links yet"
        emptyDescription="Add your first link to build the site navigation."
      />

      <NavbarItemFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, item: open ? formModalState.item : null })}
        item={formModalState.item}
      />

      <ConfirmDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title="Delete this navbar item?"
        description={`"${itemToDelete?.label}" will be removed from the navigation.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteNavbarItem.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
