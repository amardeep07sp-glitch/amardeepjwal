import { Eye, MousePointerClick, TrendingUp, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/global/EmptyState';
import { useCollectionPerformance } from './collectionsApi';

function StatTile({ label, value, icon: Icon }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-heading">{value}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

// Two real layers, same split Category already has: the always-available
// cheap viewCount/clickCount counters (from the collection document itself -
// never empty, even for a brand new collection), plus the deeper CIP
// collection_view/session-join numbers (views/conversion/exitRate) once any
// exist. No fabricated numbers, no chart built from data this app doesn't
// actually have (see collectionAnalytics.service.js - it's a top-N ranking,
// not a per-collection daily time series, so an honest stat-tile layout is
// used here instead of a line chart that would need to invent one).
export function CollectionAnalyticsTab({ collectionId, viewCount = 0, clickCount = 0 }) {
  const { data: rows } = useCollectionPerformance({ limit: 50 });
  const row = rows?.find((r) => r.collectionId === collectionId);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Page views" value={viewCount} icon={Eye} />
        <StatTile label="Clicks (from listings)" value={clickCount} icon={MousePointerClick} />
      </div>

      {row ? (
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Conversion rate" value={`${row.conversion}%`} icon={TrendingUp} />
          <StatTile label="Exit rate" value={`${row.exitRate}%`} icon={LogOut} />
        </div>
      ) : (
        <EmptyState
          title="No deeper analytics yet"
          description="Conversion and exit-rate data will show up here once customers start browsing this collection."
        />
      )}
    </div>
  );
}
