import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { useFooterColumns, useDeleteFooterColumn } from './footerColumnsApi';
import { FooterColumnFormModal } from './FooterColumnFormModal';

export default function FooterColumnsListPage() {
  const { data: columns = [], isLoading, error, refetch } = useFooterColumns();
  const deleteFooterColumn = useDeleteFooterColumn();

  const [formModalState, setFormModalState] = useState({ open: false, column: null });
  const [columnToDelete, setColumnToDelete] = useState(null);

  const handleDeleteConfirm = async () => {
    try {
      await deleteFooterColumn.mutateAsync(columnToDelete._id);
      toast.success('Footer column deleted successfully');
      setColumnToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const tableColumns = [
    { key: 'title', header: 'Column' },
    { key: 'linkCount', header: 'Links', render: (column) => column.links?.length ?? 0 },
    { key: 'order', header: 'Order' },
    {
      key: 'isActive',
      header: 'Status',
      render: (column) => (
        <Badge variant={column.isActive ? 'success' : 'secondary'}>
          {column.isActive ? 'Active' : 'Hidden'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (column) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${column.title}`}
            onClick={() => setFormModalState({ open: true, column })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${column.title}`}
            onClick={() => setColumnToDelete(column)}
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
          <h1 className="text-h4 font-semibold text-heading">Footer</h1>
          <p className="text-sm text-muted-foreground">Manage the link columns shown in the site footer.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, column: null })}>
          <Plus />
          New column
        </Button>
      </div>

      <DataTable
        columns={tableColumns}
        data={columns}
        rowKey={(column) => column._id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No footer columns yet"
        emptyDescription="Add a column to start building the footer."
      />

      <FooterColumnFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, column: open ? formModalState.column : null })}
        column={formModalState.column}
      />

      <ConfirmDialog
        open={Boolean(columnToDelete)}
        onOpenChange={(open) => !open && setColumnToDelete(null)}
        title="Delete this footer column?"
        description={`"${columnToDelete?.title}" and its links will be removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteFooterColumn.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
