import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LifeBuoy, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyTickets } from '@/features/support/supportApi';
import { AccountLayout } from '@/components/account/AccountLayout';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Pagination } from '@/components/global/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { GetSupportButton } from '@/components/support/GetSupportButton';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Waiting on You', value: 'waiting_for_customer' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const STATUS_STYLE = {
  open: 'bg-info/10 text-info',
  in_progress: 'bg-warning/10 text-warning',
  waiting_for_customer: 'bg-muted text-muted-foreground',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function SupportCenterPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const [status, setStatus] = useState(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useMyTickets({ page, limit: 10, status });

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  return (
    <AccountLayout
      title="Help & Support"
      subtitle="View your support tickets or start a new one"
      icon={LifeBuoy}
      breadcrumbLabel="Support"
      headerExtra={<GetSupportButton triggerLabel="New ticket" variant="default" />}
    >
      <div className="mb-4 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
        Looking for a quick answer instead? Try the{' '}
        <Link to="/help" className="font-medium text-primary hover:underline">
          Help Center
        </Link>
        .
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              status === tab.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No support tickets yet" description="Need help with something? Start a new ticket above." />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.items.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/support/tickets/${ticket.id}`}
                className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border transition-colors hover:ring-primary/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                  <p className="truncate text-sm font-semibold text-heading">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">Created {formatDate(ticket.createdAt)}</p>
                </div>
                <span className={cn('w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize', STATUS_STYLE[ticket.status] ?? 'bg-muted text-muted-foreground')}>
                  {ticket.status.replace(/_/g, ' ')}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} totalItems={data.meta.totalItems} onPageChange={setPage} />
          </div>
        </>
      )}
    </AccountLayout>
  );
}
