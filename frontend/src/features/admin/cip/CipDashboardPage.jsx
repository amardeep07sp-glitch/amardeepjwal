import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, Activity, Search, Repeat, Percent } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useCipDashboardCards, useCipDashboardWidgets } from './cipApi';

const CHART_COLOR = '#c8a24a';
const GRID_STROKE = 'var(--border)';
const AXIS_TEXT_CLASS = 'fill-muted-foreground text-xs';

function StatCard({ label, value, icon: Icon, tone = 'default', suffix = '' }) {
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
          <p className="text-2xl font-semibold text-heading">{value ?? 0}{suffix}</p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

function RankingCard({ title, data, nameKey, valueKey, valueLabel }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-64 pt-2">
        {!data || data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} />
              <YAxis type="category" dataKey={nameKey} axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={110} />
              <Tooltip
                cursor={{ fill: 'var(--muted)' }}
                contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [value, valueLabel]}
              />
              <Bar dataKey={valueKey} fill={CHART_COLOR} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueFunnelCard({ funnel }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle>Revenue Funnel</CardTitle></CardHeader>
      <CardContent className="h-72 pt-2">
        {!funnel || funnel.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No funnel activity yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="vertical" margin={{ top: 8, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} />
              <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={90} />
              <Tooltip
                cursor={{ fill: 'var(--muted)' }}
                contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(value, name, props) => [`${value} sessions (${props.payload.dropOffRate}% drop-off)`, props.payload.label]}
              />
              <Bar dataKey="sessions" fill={CHART_COLOR} radius={[0, 4, 4, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function CipDashboardPage() {
  const { data: cards, isLoading, error, refetch } = useCipDashboardCards();
  const { data: widgets } = useCipDashboardWidgets(14);

  if (isLoading) return <PageLoader label="Loading Customer Intelligence dashboard..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Customer Intelligence Dashboard</h1>
        <p className="text-sm text-muted-foreground">Realtime visitors, search activity, and the conversion funnel - read-only.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Realtime Visitors" value={cards?.realtimeVisitors} icon={Users} tone="success" />
        <StatCard label="Active Sessions" value={cards?.activeSessions} icon={Activity} tone="success" />
        <StatCard label="Today's Searches" value={cards?.todaysSearches} icon={Search} />
        <StatCard label="Returning Customers" value={cards?.returningCustomers} icon={Repeat} />
        <StatCard label="Conversion Rate" value={cards?.conversionRate} icon={Percent} tone="warning" suffix="%" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueFunnelCard funnel={widgets?.revenueFunnel} />
        <RankingCard title="Top Products (14 days)" data={widgets?.topProducts} nameKey="name" valueKey="views" valueLabel="Views" />
        <RankingCard title="Top Categories (14 days)" data={widgets?.topCategories} nameKey="name" valueKey="views" valueLabel="Views" />
        <RankingCard title="Top Brands (14 days)" data={widgets?.topBrands} nameKey="name" valueKey="revenue" valueLabel="Revenue" />
      </div>

      <Card>
        <CardHeader><CardTitle>Top Campaigns (14 days)</CardTitle></CardHeader>
        <CardContent>
          {!widgets?.topCampaigns || widgets.topCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaign activity yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                    <th className="px-3 py-2">Campaign</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Orders</th>
                    <th className="px-3 py-2 text-right">Revenue</th>
                    <th className="px-3 py-2 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {widgets.topCampaigns.map((c, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{c.campaign}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.source}</td>
                      <td className="px-3 py-2 text-right">{c.orders}</td>
                      <td className="px-3 py-2 text-right">₹{c.revenue.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{c.roas !== null ? `${c.roas}x` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
