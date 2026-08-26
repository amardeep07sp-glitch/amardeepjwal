import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { Search } from 'lucide-react';
import { useHelpSearchAnalytics } from './helpApi';

function QueryList({ items, emptyText, variant }) {
  if (!items?.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="flex flex-col divide-y divide-border">
      {items.map((row) => (
        <div key={row.query} className="flex items-center justify-between gap-3 py-2.5">
          <span className="text-sm text-heading">{row.query}</span>
          <Badge variant={variant}>{row.count}×</Badge>
        </div>
      ))}
    </div>
  );
}

export default function HelpSearchAnalyticsPage() {
  const { data, isLoading, error, refetch } = useHelpSearchAnalytics();

  if (isLoading) return <PageLoader label="Loading search analytics..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  if (!data?.totalSearches) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Help Search Analytics</h1>
          <p className="text-sm text-muted-foreground">What customers search for in the Help Center, and what turns up nothing.</p>
        </div>
        <EmptyState icon={Search} title="No searches logged yet" description="Once customers use the Help Center search bar, results appear here." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Help Search Analytics</h1>
        <p className="text-sm text-muted-foreground">What customers search for in the Help Center, and what turns up nothing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total searches</p>
            <p className="text-h3 font-semibold text-heading">{data.totalSearches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No-result searches</p>
            <p className="text-h3 font-semibold text-heading">
              {data.noResultSearches}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                ({data.totalSearches ? Math.round((data.noResultSearches / data.totalSearches) * 100) : 0}%)
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryList items={data.topQueries} emptyText="No searches yet." variant="secondary" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Searches With No Results</CardTitle>
            <p className="text-xs text-muted-foreground">A strong signal for articles worth writing next.</p>
          </CardHeader>
          <CardContent>
            <QueryList items={data.noResultQueries} emptyText="Every search has found something so far." variant="warning" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
