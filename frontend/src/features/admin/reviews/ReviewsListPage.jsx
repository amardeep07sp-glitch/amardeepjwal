import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Flag, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useReviews, useModerateReview, useDeleteReview, useReportedReviews } from './reviewsApi';

const STATUS_TABS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Reported', value: 'reported' },
  { label: 'All', value: undefined },
];

const REASON_LABELS = {
  spam: 'Spam',
  fake_review: 'Fake review',
  offensive: 'Offensive',
  irrelevant: 'Irrelevant',
  misleading: 'Misleading',
  personal_information: 'Personal info',
  other: 'Other',
};

const STATUS_VARIANT = { pending: 'warning', approved: 'success', rejected: 'destructive' };

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3.5 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function ReviewsListPage() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const isReportedTab = status === 'reported';
  const queryClient = useQueryClient();
  const [dismissingId, setDismissingId] = useState(null);

  const { data, isLoading, error, refetch } = useReviews({ page, limit: DEFAULT_PAGE_SIZE, status }, { enabled: !isReportedTab });
  const {
    data: reportedData,
    isLoading: isReportedLoading,
    error: reportedError,
    refetch: refetchReported,
  } = useReportedReviews({ page, limit: DEFAULT_PAGE_SIZE }, { enabled: isReportedTab });
  const moderateReview = useModerateReview();
  const deleteReview = useDeleteReview();

  const reviews = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };
  const reportedItems = reportedData?.items ?? [];
  const reportedMeta = reportedData?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleModerate = async (id, nextStatus) => {
    try {
      await moderateReview.mutateAsync({ id, status: nextStatus });
      toast.success(`Review ${nextStatus}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReview.mutateAsync(id);
      toast.success('Review deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Dismisses every still-PENDING report on this review as unfounded -
  // doesn't touch the review's own approved/rejected status, that's a
  // separate admin call (the same Approve/Reject buttons every other tab
  // uses). Composite action (fetch reports -> dismiss each) done inline
  // here rather than as its own hook since it's a one-off admin action,
  // not data the rest of the page needs to stay subscribed to.
  const handleDismissReports = async (reviewId) => {
    setDismissingId(reviewId);
    try {
      const res = await api.get(`/reviews/${reviewId}/reports`);
      const pending = (res.data ?? []).filter((r) => r.status === 'pending');
      await Promise.all(pending.map((r) => api.patch(`/reviews/reports/${r.id}/dismiss`)));
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Reports dismissed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDismissingId(null);
    }
  };

  const reportedColumns = [
    {
      key: 'product',
      header: 'Product',
      render: ({ review }) =>
        typeof review.product === 'object' ? (
          <Link to={`/admin/catalog/products?search=${review.product.name}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
            {review.product.name} <ExternalLink className="size-3" />
          </Link>
        ) : (
          '-'
        ),
    },
    { key: 'customer', header: 'Reviewer', render: ({ review }) => (typeof review.customer === 'object' ? review.customer.name : '-') },
    { key: 'rating', header: 'Rating', render: ({ review }) => <Stars rating={review.rating} /> },
    {
      key: 'content',
      header: 'Review',
      render: ({ review }) => (
        <div className="max-w-xs">
          {review.title && <p className="text-sm font-medium text-heading">{review.title}</p>}
          <p className="line-clamp-2 text-xs text-muted-foreground">{review.comment || '-'}</p>
        </div>
      ),
    },
    {
      key: 'reports',
      header: 'Reports',
      render: ({ pendingReportCount, reasons }) => (
        <div className="flex flex-col gap-1">
          <Badge variant="destructive" className="w-fit gap-1">
            <Flag className="size-3" /> {pendingReportCount}
          </Badge>
          <div className="flex flex-wrap gap-1">
            {(reasons ?? []).map((reason) => (
              <span key={reason} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {REASON_LABELS[reason] ?? reason}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Review Status',
      render: ({ review }) => (
        <Badge variant={STATUS_VARIANT[review.status] ?? 'secondary'} className="capitalize">
          {review.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-56',
      render: ({ review }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Approve review" onClick={() => handleModerate(review.id, 'approved')}>
            <Check className="size-4 text-success" />
          </Button>
          <Button variant="ghost" size="icon" title="Reject review" onClick={() => handleModerate(review.id, 'rejected')}>
            <X className="size-4 text-destructive" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Dismiss all reports as unfounded"
            loading={dismissingId === review.id}
            onClick={() => handleDismissReports(review.id)}
          >
            Dismiss reports
          </Button>
        </div>
      ),
    },
  ];

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (r) =>
        typeof r.product === 'object' ? (
          <Link to={`/admin/catalog/products?search=${r.product.name}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
            {r.product.name} <ExternalLink className="size-3" />
          </Link>
        ) : (
          '-'
        ),
    },
    { key: 'customer', header: 'Reviewer', render: (r) => (typeof r.customer === 'object' ? r.customer.name : '-') },
    { key: 'rating', header: 'Rating', render: (r) => <Stars rating={r.rating} /> },
    {
      key: 'content',
      header: 'Review',
      render: (r) => (
        <div className="max-w-xs">
          {r.title && <p className="text-sm font-medium text-heading">{r.title}</p>}
          <p className="line-clamp-2 text-xs text-muted-foreground">{r.comment || '-'}</p>
        </div>
      ),
    },
    {
      key: 'verified',
      header: 'Verified',
      render: (r) => (r.isVerifiedPurchase ? <Badge variant="success">Verified Purchase</Badge> : null),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={STATUS_VARIANT[r.status] ?? 'secondary'} className="capitalize">
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-40',
      render: (r) => (
        <div className="flex items-center gap-1">
          {r.status !== 'approved' && (
            <Button variant="ghost" size="icon" title="Approve" onClick={() => handleModerate(r.id, 'approved')}>
              <Check className="size-4 text-success" />
            </Button>
          )}
          {r.status !== 'rejected' && (
            <Button variant="ghost" size="icon" title="Reject" onClick={() => handleModerate(r.id, 'rejected')}>
              <X className="size-4 text-destructive" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(r.id)}>
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Reviews</h1>
        <p className="text-sm text-muted-foreground">Moderate customer product reviews before they go live on the storefront.</p>
      </div>

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

      <DataTable
        columns={isReportedTab ? reportedColumns : columns}
        data={isReportedTab ? reportedItems : reviews}
        rowKey={(r) => (isReportedTab ? r.review.id : r.id)}
        isLoading={isReportedTab ? isReportedLoading : isLoading}
        error={isReportedTab ? reportedError : error}
        onRetry={isReportedTab ? refetchReported : refetch}
        emptyTitle={isReportedTab ? 'No reported reviews' : 'No reviews here'}
        emptyDescription={
          isReportedTab ? "Reviews flagged by customers will show up here." : 'Customer reviews will show up here once submitted.'
        }
        pagination={{
          page: isReportedTab ? reportedMeta.page : meta.page,
          totalPages: isReportedTab ? reportedMeta.totalPages : meta.totalPages,
          totalItems: isReportedTab ? reportedMeta.totalItems : meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
