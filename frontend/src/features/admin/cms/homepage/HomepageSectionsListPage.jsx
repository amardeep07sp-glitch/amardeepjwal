import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { useHomepageSections, useDeleteHomepageSection } from './homepageSectionsApi';
import { HomepageSectionFormModal } from './HomepageSectionFormModal';

const TYPE_LABELS = { banner: 'Banner', text_block: 'Text block' };

export default function HomepageSectionsListPage() {
  const { data: sections = [], isLoading, error, refetch } = useHomepageSections();
  const deleteSection = useDeleteHomepageSection();

  const [formModalState, setFormModalState] = useState({ open: false, section: null });
  const [sectionToDelete, setSectionToDelete] = useState(null);

  const handleDeleteConfirm = async () => {
    try {
      await deleteSection.mutateAsync(sectionToDelete.id);
      toast.success('Homepage section deleted successfully');
      setSectionToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'internalTitle', header: 'Section' },
    { key: 'type', header: 'Type', render: (section) => TYPE_LABELS[section.type] ?? section.type },
    { key: 'order', header: 'Order' },
    {
      key: 'isActive',
      header: 'Status',
      render: (section) => (
        <Badge variant={section.isActive ? 'success' : 'secondary'}>
          {section.isActive ? 'Active' : 'Hidden'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (section) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${section.internalTitle}`}
            onClick={() => setFormModalState({ open: true, section })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${section.internalTitle}`}
            onClick={() => setSectionToDelete(section)}
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
          <h1 className="text-h4 font-semibold text-heading">Homepage</h1>
          <p className="text-sm text-muted-foreground">
            Build the homepage from an ordered list of sections.
          </p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, section: null })}>
          <Plus />
          New section
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sections}
        rowKey={(section) => section.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No homepage sections yet"
        emptyDescription="Add a banner or text block to start building the homepage."
      />

      <HomepageSectionFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, section: open ? formModalState.section : null })}
        section={formModalState.section}
      />

      <ConfirmDialog
        open={Boolean(sectionToDelete)}
        onOpenChange={(open) => !open && setSectionToDelete(null)}
        title="Delete this section?"
        description={`"${sectionToDelete?.internalTitle}" will be removed from the homepage.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteSection.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
