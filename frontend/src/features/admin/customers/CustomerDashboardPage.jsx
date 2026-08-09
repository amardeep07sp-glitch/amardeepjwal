import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, UserPlus, Star, Repeat, IndianRupee, Wallet, Gift } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useDashboardTotals, useGrowthTrend } from './customersApi';

// Same single-hue convention established in InventoryDashboardPage.jsx /
// OrderDashboardPage.jsx.
const CHART_COLOR = '#c8a24a';
const GRID_STROKE = 'var(--border)';
const AXIS_TEXT_CLASS = 'fill-muted-foreground text-xs';

const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: value >= 100000 ? 'compact' : 'standard' }).format(value ?? 0);
const formatCurrency = (value) => `₹${formatCompact(value)}`;

function StatCard({ label, value, icon: Icon, tone = 'default', format = formatCompact }) {
  const toneClasses = {
    default: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
  };

  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-heading">{format(value)}</p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-heading">{new Date(label).toLocaleDateString()}</p>
      <p className="text-muted-foreground">{payload[0].value} new customer(s)</p>
    </div>
  );
}

export default function CustomerDashboardPage() {
  const { data: totals, isLoading, error, refetch } = useDashboardTotals();
  const { data: trend } = useGrowthTrend(14);

  if (isLoading) return <PageLoader label="Loading dashboard..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  const counts = totals?.countsByStatus ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Customer Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of every customer relationship.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total customers" value={totals?.totalCustomers} icon={Users} />
        <StatCard label="New (last 30 days)" value={totals?.newCustomers} icon={UserPlus} tone="success" />
        <StatCard label="VIP customers" value={counts.vip ?? totals?.vipCustomers} icon={Star} tone="warning" />
        <StatCard label="Returning customers" value={totals?.returningCustomers} icon={Repeat} />
        <StatCard label="Lifetime value" value={totals?.lifetimeValue} icon={IndianRupee} format={formatCurrency} tone="success" />
        <StatCard label="Total wallet balance" value={totals?.totalWalletBalance} icon={Wallet} format={formatCurrency} />
        <StatCard label="Total reward points" value={totals?.totalRewardPoints} icon={Gift} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer growth (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend ?? []} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={32} allowDecimals={false} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--border)' }} />
              <Line type="monotone" dataKey="count" stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3, fill: CHART_COLOR }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
