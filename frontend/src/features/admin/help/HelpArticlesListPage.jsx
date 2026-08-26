import { useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useHelpArticlesAdmin, useDeleteHelpArticle } from './helpApi';
import { HelpArticleFormModal } from './HelpArticleFormModal';
import { HELP_CATEGORIES, HELP_ARTICLE_STATUSES, HELP_STATUS_BADGE_VARIANTS } from './helpSchema';

const STATUS_FILTER_ALL = 'all';
const CATEGORY_FILTER_ALL = 'all';

const categoryLabel = (value) => HELP_CATEGORIES.find((c) => c.value === value)?.label ?? value;

export default function HelpArticlesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [categoryFilter, setCategoryFilter] = useState(CATEGORY_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [formModalState, setFormModalState] = useState({ open: false, article: null });
  const [articleToDelete, setArticleToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useHelpArticlesAdmin({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    category: categoryFilter === CATEGORY_FILTER_ALL ? undefined : categoryFilter,
  });
  const deleteArticle = useDeleteHelpArticle();

  const articles = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleDeleteConfirm = async () => {
    try {
      await deleteArticle.mutateAsync(articleToDelete.id);
      toast.success('Help article deleted successfully');
      setArticleToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Article',
      render: (a) => (
        <div className="flex items-center gap-1.5">
          {a.featured && <Star className="size-3.5 shrink-0 fill-warning text-warning" />}
          <div>
            <span className="font-medium text-heading">{a.title}</span>
            {a.summary && <p className="mt-0.5 max-w-72 truncate text-xs text-muted-foreground">{a.summary}</p>}
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (a) => categoryLabel(a.category) },
    { key: 'views', header: 'Views', render: (a) => a.viewCount.toLocaleString('en-IN') },
    {
      key: 'helpful',
      header: 'Helpful',
      render: (a) => (a.helpfulCount + a.notHelpfulCount > 0 ? `${a.helpfulCount} / ${a.helpfulCount + a.notHelpfulCount}` : '-'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <Badge variant={HELP_STATUS_BADGE_VARIANTS[a.status] ?? 'secondary'} className="capitalize">
          {a.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (article) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${article.title}`} onClick={() => setFormModalState({ open: true, article })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${article.title}`} onClick={() => setArticleToDelete(article)}>
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
          <h1 className="text-h4 font-semibold text-heading">Help Center</h1>
          <p className="text-sm text-muted-foreground">Manage the articles and FAQs customers see in the Help Center.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, article: null })}>
          <Plus />
          New article
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={articles}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search articles..."
        toolbarActions={
          <div className="flex items-center gap-2">
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CATEGORY_FILTER_ALL}>All categories</SelectItem>
                {HELP_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
                {HELP_ARTICLE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        emptyTitle="No help articles yet"
        emptyDescription="Create your first article to start building the Help Center."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <HelpArticleFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, article: open ? formModalState.article : null })}
        article={formModalState.article}
      />

      <ConfirmDialog
        open={Boolean(articleToDelete)}
        onOpenChange={(open) => !open && setArticleToDelete(null)}
        title="Delete this article?"
        description={`"${articleToDelete?.title}" will be permanently removed from the Help Center.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteArticle.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
