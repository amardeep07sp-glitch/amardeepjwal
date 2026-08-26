import { useState } from 'react';
import { Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useFeedbackList, useFeedbackSummary } from './feedbackApi';

const FEEDBACK_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'product', label: 'Product' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'website', label: 'Website' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'support', label: 'Support' },
  { value: 'suggestion', label: 'Suggestion' },
];

const categoryLabel = (value) => FEEDBACK_CATEGORIES.find((c) => c.value === value)?.label ?? value;
const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function Stars({ rating }) {
  if (!rating) return <span className="text-xs text-muted-foreground">-</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3.5 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function FeedbackListPage() {
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  const { data: summary } = useFeedbackSummary();
  const { data, isLoading, error, refetch } = useFeedbackList({ page, limit: DEFAULT_PAGE_SIZE, category: category === 'all' ? undefined : category });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    { key: 'customer', header: 'Customer', render: (f) => f.customer?.name ?? '-' },
    { key: 'category', header: 'Category', render: (f) => <Badge variant="secondary" className="capitalize">{categoryLabel(f.category)}</Badge> },
    { key: 'rating', header: 'Rating', render: (f) => <Stars rating={f.rating} /> },
    { key: 'message', header: 'Feedback', render: (f) => <p className="line-clamp-2 max-w-md text-sm text-heading">{f.message}</p> },
    { key: 'pageContext', header: 'From page', render: (f) => <span className="text-xs text-muted-foreground">{f.pageContext || '-'}</span> },
    { key: 'createdAt', header: 'Date', render: (f) => <span className="text-sm text-muted-foreground">{formatDate(f.createdAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Feedback</h1>
        <p className="text-sm text-muted-foreground">Customer opinions and suggestions - not support requests, just signal to act on.</p>
      </div>

      {summary?.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summary.map((row) => (
            <Card key={row.category} size="sm">
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">{categoryLabel(row.category)}</p>
                <p className="text-xl font-semibold text-heading">{row.count}</p>
                {row.avgRating != null && <p className="text-xs text-muted-foreground">Avg rating {row.avgRating}/5</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        rowKey={(f) => f.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        toolbarActions={
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {FEEDBACK_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No feedback yet"
        emptyDescription="Customer feedback will show up here once submitted."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
