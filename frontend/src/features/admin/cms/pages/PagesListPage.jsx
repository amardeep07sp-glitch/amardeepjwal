import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { usePages, useDeletePage } from './pagesApi';
import { PageFormModal } from './PageFormModal';

export default function PagesListPage() {
  const { data: pages = [], isLoading, error, refetch } = usePages();
  const deletePage = useDeletePage();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formModalState, setFormModalState] = useState({ open: false, page: null });
  const [pageToDelete, setPageToDelete] = useState(null);

  const filteredPages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return pages;
    return pages.filter(
      (page) => page.title.toLowerCase().includes(term) || page.slug.toLowerCase().includes(term)
    );
  }, [pages, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / DEFAULT_PAGE_SIZE));
  const paginatedPages = filteredPages.slice(
    (currentPage - 1) * DEFAULT_PAGE_SIZE,
    currentPage * DEFAULT_PAGE_SIZE
  );

  const handleDeleteConfirm = async () => {
    try {
      await deletePage.mutateAsync(pageToDelete.id);
      toast.success('Page deleted successfully');
      setPageToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'slug', header: 'Slug', render: (page) => <span className="text-muted-foreground">/{page.slug}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (page) => (
        <Badge variant={page.status === 'published' ? 'success' : 'secondary'} className="capitalize">
          {page.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (page) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${page.title}`}
            onClick={() => setFormModalState({ open: true, page })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${page.title}`}
            onClick={() => setPageToDelete(page)}
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
          <h1 className="text-h4 font-semibold text-heading">Static Pages</h1>
          <p className="text-sm text-muted-foreground">Manage standalone pages like About Us or Contact.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, page: null })}>
          <Plus />
          New page
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginatedPages}
        rowKey={(page) => page.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search pages..."
        emptyTitle="No pages yet"
        emptyDescription="Create your first static page to get started."
        pagination={{
          page: currentPage,
          totalPages,
          totalItems: filteredPages.length,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setCurrentPage,
        }}
      />

      <PageFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, page: open ? formModalState.page : null })}
        page={formModalState.page}
      />

      <ConfirmDialog
        open={Boolean(pageToDelete)}
        onOpenChange={(open) => !open && setPageToDelete(null)}
        title="Delete this page?"
        description={`"${pageToDelete?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deletePage.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
