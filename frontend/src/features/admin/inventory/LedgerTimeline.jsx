import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/global/EmptyState';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useInventoryLedger } from './inventoryApi';
import { MOVEMENT_TYPE_LABELS } from './inventorySchema';

export function LedgerTimeline({ inventoryId }) {
  const { data, isLoading, error, refetch } = useInventoryLedger(inventoryId, { limit: 50 });
  const entries = data?.items ?? [];

  if (isLoading) return <PageLoader label="Loading ledger..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;
  if (entries.length === 0) {
    return <EmptyState title="No movements yet" description="Every stock change for this item will show up here." />;
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{MOVEMENT_TYPE_LABELS[entry.movementType] ?? entry.movementType}</Badge>
            <span className="flex items-center gap-1.5 text-sm font-medium text-heading">
              <span>{entry.quantityBefore}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span>{entry.quantityAfter}</span>
            </span>
            <span className={entry.quantityChanged >= 0 ? 'text-sm text-success' : 'text-sm text-destructive'}>
              {entry.quantityChanged >= 0 ? '+' : ''}
              {entry.quantityChanged}
            </span>
          </div>
          {entry.reason && <p className="text-sm text-muted-foreground">{entry.reason}</p>}
          <p className="text-xs text-muted-foreground">
            {entry.performedBy?.name ?? 'System'} · {new Date(entry.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}
