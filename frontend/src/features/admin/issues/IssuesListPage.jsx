import { useState } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useIssues } from './issuesApi';
import { IssueDetailDrawer } from './IssueDetailDrawer';
import { ISSUE_CATEGORIES, ISSUE_STATUS_VARIANTS } from './issuesSchema';

const STATUS_TABS = [
  { label: 'Open', value: 'open' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: undefined },
];

const categoryLabel = (value) => ISSUE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
const formatDate = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function IssuesListPage() {
  const [status, setStatus] = useState('open');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const { data, isLoading, error, refetch } = useIssues({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status,
    category: category === 'all' ? undefined : category,
  });

  const issues = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    {
      key: 'issueNumber',
      header: 'Issue',
      render: (i) => (
        <div>
          <span className="font-mono text-sm font-semibold text-heading">{i.issueNumber}</span>
          <p className="mt-0.5 max-w-64 truncate text-xs text-muted-foreground">{i.description}</p>
        </div>
      ),
    },
    { key: 'reporter', header: 'Reporter', render: (i) => i.reporter?.name ?? '-' },
    { key: 'category', header: 'Category', render: (i) => categoryLabel(i.category) },
    { key: 'reason', header: 'Reason', render: (i) => <span className="text-xs text-muted-foreground capitalize">{i.subCategory?.replace(/_/g, ' ') || '-'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <Badge variant={ISSUE_STATUS_VARIANTS[i.status] ?? 'secondary'} className="capitalize">
          {i.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { key: 'assignedTo', header: 'Assigned', render: (i) => i.assignedTo?.name ?? <span className="text-muted-foreground">Unassigned</span> },
    { key: 'createdAt', header: 'Reported', render: (i) => <span className="text-sm text-muted-foreground">{formatDate(i.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-16',
      render: (i) => (
        <Button variant="ghost" size="icon-sm" aria-label={`View ${i.issueNumber}`} onClick={() => setSelectedIssue(i)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Issue Reports</h1>
        <p className="text-sm text-muted-foreground">Contextual problem reports customers file from products, orders, coupons, payments and more.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {ISSUE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={issues}
        rowKey={(i) => i.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No issue reports here"
        emptyDescription="Contextual issue reports will show up here once customers file them."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <IssueDetailDrawer open={Boolean(selectedIssue)} onOpenChange={(open) => !open && setSelectedIssue(null)} issue={selectedIssue} />
    </div>
  );
}
