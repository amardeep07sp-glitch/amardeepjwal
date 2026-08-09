import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Package, Bookmark, AlertTriangle, Undo2, Truck, TrendingDown, XCircle, Boxes } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { Badge } from '@/components/ui/badge';
import { useDashboardTotals, useRecentMovements } from './inventoryApi';
import { MOVEMENT_TYPE_LABELS } from './inventorySchema';

// The first chart mark color in this codebase - a single-series bar chart
// (magnitude across stock-type categories, not identity) uses one hue rather
// than the placeholder --chart-1..5 ramp, matching --primary exactly so it
// stays correct in both light and dark (the token is identical in both).
const BAR_COLOR = '#c8a24a';
const GRID_STROKE = 'var(--border)';
const AXIS_TEXT_CLASS = 'fill-muted-foreground text-xs';

const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: value >= 100000 ? 'compact' : 'standard' }).format(value ?? 0);

function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };

  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-heading">{formatCompact(value)}</p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-heading">{label}</p>
      <p className="text-muted-foreground">{formatCompact(payload[0].value)} units</p>
    </div>
  );
}

export default function InventoryDashboardPage() {
  const { data: totals, isLoading: totalsLoading, error: totalsError, refetch: refetchTotals } = useDashboardTotals();
  const { data: movements, isLoading: movementsLoading, error: movementsError, refetch: refetchMovements } = useRecentMovements(10);

  if (totalsLoading) return <PageLoader label="Loading dashboard..." />;
  if (totalsError) return <ErrorState description={totalsError.message} actionLabel="Retry" onAction={refetchTotals} />;

  const chartData = [
    { name: 'Available', value: totals?.totalAvailable ?? 0 },
    { name: 'Reserved', value: totals?.totalReserved ?? 0 },
    { name: 'Damaged', value: totals?.totalDamaged ?? 0 },
    { name: 'Returned', value: totals?.totalReturned ?? 0 },
    { name: 'Incoming', value: totals?.totalIncoming ?? 0 },
  ];

  const recentMovements = movements ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Inventory Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live stock totals across every warehouse.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available stock" value={totals?.totalAvailable} icon={Package} />
        <StatCard label="Reserved stock" value={totals?.totalReserved} icon={Bookmark} />
        <StatCard label="Damaged stock" value={totals?.totalDamaged} icon={AlertTriangle} />
        <StatCard label="Returned stock" value={totals?.totalReturned} icon={Undo2} />
        <StatCard label="Incoming stock" value={totals?.totalIncoming} icon={Truck} />
        <StatCard label="Low stock items" value={totals?.lowStockCount} icon={TrendingDown} tone="warning" />
        <StatCard label="Out of stock items" value={totals?.outOfStockCount} icon={XCircle} tone="destructive" />
        <StatCard label="Total inventory records" value={totals?.totalRecords} icon={Boxes} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Stock by type</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} />
                <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={48} tickFormatter={formatCompact} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                  <LabelList dataKey="value" position="top" formatter={formatCompact} className="fill-heading text-xs font-medium" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent movements</CardTitle>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <PageLoader label="Loading movements..." />
            ) : movementsError ? (
              <ErrorState description={movementsError.message} actionLabel="Retry" onAction={refetchMovements} />
            ) : recentMovements.length === 0 ? (
              <EmptyState title="No movements yet" description="Stock changes will appear here as they happen." />
            ) : (
              <ol className="flex flex-col gap-3">
                {recentMovements.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-heading">{entry.product?.name ?? 'Unknown product'}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {MOVEMENT_TYPE_LABELS[entry.movementType] ?? entry.movementType}
                        </Badge>
                        {entry.performedBy?.name ?? 'System'} · {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span className={entry.quantityChanged >= 0 ? 'shrink-0 text-sm font-medium text-success' : 'shrink-0 text-sm font-medium text-destructive'}>
                      {entry.quantityChanged >= 0 ? '+' : ''}
                      {entry.quantityChanged}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
