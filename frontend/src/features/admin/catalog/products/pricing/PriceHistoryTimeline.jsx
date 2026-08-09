import { ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/global/EmptyState';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useProductPriceHistory } from './pricingApi';
import { formatCurrency } from './formatCurrency';

export function PriceHistoryTimeline({ productId, currency }) {
  const { data, isLoading, error, refetch } = useProductPriceHistory(productId, { limit: 20 });
  const entries = data?.items ?? [];

  if (isLoading) return <PageLoader label="Loading price history..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;
  if (entries.length === 0) {
    return <EmptyState title="No price changes yet" description="Every pricing update will show up here." />;
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-heading">
            <span>{formatCurrency(entry.oldPrice, currency)}</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span>{formatCurrency(entry.newPrice, currency)}</span>
          </div>
          {entry.reason && <p className="text-sm text-muted-foreground">{entry.reason}</p>}
          <p className="text-xs text-muted-foreground">
            {entry.updatedBy?.name ?? 'Unknown'} · {new Date(entry.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
