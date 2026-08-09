import { Layers, CheckCircle2, CalendarClock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { useCollectionDashboardStats, useCollections, useCollectionPerformance } from './collectionsApi';
import { COLLECTION_TYPE_OPTIONS } from './collectionSchema';

function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
  };
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-heading">{value}</p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

// Every number here is real - counts from a grouped aggregation, or a plain
// sort of the existing collections list. No chart is fabricated for data
// this app doesn't have; the CIP panel shows an honest empty-state until
// real collection_view events exist, exactly like CategoriesAnalyticsView's
// own "not enough data yet" copy.
export default function CollectionDashboardPage() {
  const { data: stats, isLoading, error, refetch } = useCollectionDashboardStats();
  const { data: topByViews } = useCollections({ limit: 5, sortBy: 'viewCount', sortOrder: 'desc' });
  const { data: performance } = useCollectionPerformance({ limit: 5 });

  if (isLoading) return <PageLoader label="Loading dashboard..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  const totalCollections = Object.values(stats?.byStatus ?? {}).reduce((sum, n) => sum + n, 0);
  const published = stats?.byStatus?.published ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Collection Dashboard</h1>
        <p className="text-sm text-muted-foreground">Merchandising overview across every collection.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total collections" value={totalCollections} icon={Layers} />
        <StatCard label="Published" value={published} icon={CheckCircle2} tone="success" />
        <StatCard label="Scheduled" value={stats?.scheduledCount ?? 0} icon={CalendarClock} tone="warning" />
        <StatCard label="Total views (all-time)" value={(topByViews?.items ?? []).reduce((sum, c) => sum + (c.viewCount ?? 0), 0)} icon={Eye} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(stats?.byType ?? {}).length === 0 ? (
              <p className="text-sm text-muted-foreground">No collections yet.</p>
            ) : (
              Object.entries(stats.byType).map(([type, count]) => (
                <Badge key={type} variant="outline" className="capitalize">
                  {COLLECTION_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? type}: {count}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top collections by views</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(topByViews?.items ?? []).filter((c) => c.viewCount > 0).length === 0 ? (
              <EmptyState title="No views recorded yet" description="Once customers open a collection page, it'll show up here." />
            ) : (
              topByViews.items
                .filter((c) => c.viewCount > 0)
                .map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-heading">{c.name}</span>
                    <span className="text-muted-foreground">{c.viewCount} views</span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CIP performance (deeper analytics)</CardTitle>
        </CardHeader>
        <CardContent>
          {(performance ?? []).length === 0 ? (
            <EmptyState title="Analytics will show up once customers start browsing" description="Conversion and exit-rate data needs real collection_view events first." />
          ) : (
            <div className="flex flex-col gap-2">
              {performance.map((row) => (
                <div key={row.collectionId} className="flex items-center justify-between text-sm">
                  <span className="text-heading">{row.name}</span>
                  <span className="text-muted-foreground">
                    {row.views} views · {row.conversion}% conversion · {row.exitRate}% exit
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
