import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ShoppingCart, Clock, Package, Truck, CheckCircle2, XCircle, IndianRupee, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useDashboardTotals, useSalesTrend, usePaymentBreakdown } from './ordersApi';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from './orderSchema';

// Same single-hue convention established in InventoryDashboardPage.jsx -
// matches --primary exactly in both light and dark (the token is identical
// in both modes), reused here rather than inventing a second chart palette.
const CHART_COLOR = '#c8a24a';
const GRID_STROKE = 'var(--border)';
const AXIS_TEXT_CLASS = 'fill-muted-foreground text-xs';

const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: value >= 100000 ? 'compact' : 'standard' }).format(value ?? 0);
const formatCurrency = (value) => `₹${formatCompact(value)}`;

function StatCard({ label, value, icon: Icon, tone = 'default', format = formatCompact }) {
  const toneClasses = {
    default: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
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

// One tooltip, every series relevant to that point - order count rides
// along even though it isn't plotted, since a second plotted line on this
// axis would be the dual-axis anti-pattern (different scale entirely).
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-heading">{new Date(label).toLocaleDateString()}</p>
      <p className="text-muted-foreground">{formatCurrency(point.revenue)} revenue</p>
      <p className="text-muted-foreground">{point.orders} order(s)</p>
    </div>
  );
}

function CategoryTooltip({ active, payload, label, valueFormatter = formatCompact }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-heading">{label}</p>
      <p className="text-muted-foreground">{valueFormatter(payload[0].value)}</p>
    </div>
  );
}

export default function OrderDashboardPage() {
  const { data: totals, isLoading, error, refetch } = useDashboardTotals();
  const { data: trend } = useSalesTrend(14);
  const { data: paymentBreakdown } = usePaymentBreakdown();

  if (isLoading) return <PageLoader label="Loading dashboard..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  const counts = totals?.countsByStatus ?? {};
  const processing = (counts.confirmed ?? 0) + (counts.packed ?? 0) + (counts.ready_to_ship ?? 0);

  const statusChartData = Object.entries(counts).map(([status, count]) => ({
    name: ORDER_STATUS_LABELS[status] ?? status,
    value: count,
  }));

  const paymentChartData = (paymentBreakdown ?? []).map((row) => ({
    name: PAYMENT_METHOD_LABELS[row.method] ?? row.method,
    value: row.amount,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Order Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live sales and fulfillment overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's orders" value={totals?.todayOrders} icon={ShoppingCart} />
        <StatCard label="Pending" value={counts.pending ?? 0} icon={Clock} tone="warning" />
        <StatCard label="Processing" value={processing} icon={Package} />
        <StatCard label="Shipped" value={counts.shipped ?? 0} icon={Truck} />
        <StatCard label="Delivered" value={counts.delivered ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Cancelled" value={counts.cancelled ?? 0} icon={XCircle} tone="destructive" />
        <StatCard label="Revenue" value={totals?.totalRevenue} icon={IndianRupee} format={formatCurrency} tone="success" />
        <StatCard label="Avg. order value" value={totals?.averageOrderValue} icon={TrendingUp} format={formatCurrency} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales trend (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend ?? []} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={formatCurrency} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--border)' }} />
              <Line type="monotone" dataKey="revenue" stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3, fill: CHART_COLOR }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={40} allowDecimals={false} />
                <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {paymentChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No payments recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} />
                  <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={formatCurrency} />
                  <Tooltip content={<CategoryTooltip valueFormatter={formatCurrency} />} cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="value" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
