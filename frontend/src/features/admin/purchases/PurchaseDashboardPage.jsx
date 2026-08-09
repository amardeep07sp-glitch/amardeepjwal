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
import { Truck, Clock, PackageCheck, IndianRupee, Building2, ShoppingBag } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useSupplierDashboardTotals } from '../suppliers/suppliersApi';
import { usePurchaseDashboardTotals, usePurchaseTrend, useSupplierPerformance } from './purchaseOrdersApi';

// Same single-hue chart convention established in InventoryDashboardPage.jsx
// / OrderDashboardPage.jsx - reused as-is, no new chart palette introduced.
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

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-heading">{new Date(label).toLocaleDateString()}</p>
      <p className="text-muted-foreground">{formatCurrency(point.value)} purchased</p>
      <p className="text-muted-foreground">{point.orders} order(s)</p>
    </div>
  );
}

function SupplierTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-heading">{label}</p>
      <p className="text-muted-foreground">{formatCurrency(point.totalValue)}</p>
      <p className="text-muted-foreground">{point.orderCount} order(s)</p>
    </div>
  );
}

export default function PurchaseDashboardPage() {
  const { data: supplierTotals, isLoading: isSupplierLoading, error, refetch } = useSupplierDashboardTotals();
  const { data: purchaseTotals, isLoading: isPurchaseLoading } = usePurchaseDashboardTotals();
  const { data: trend } = usePurchaseTrend(14);
  const { data: performance } = useSupplierPerformance();

  if (isSupplierLoading || isPurchaseLoading) return <PageLoader label="Loading dashboard..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  const performanceChartData = (performance ?? []).map((row) => ({ name: row.name, totalValue: row.totalValue, orderCount: row.orderCount }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Purchase Dashboard</h1>
        <p className="text-sm text-muted-foreground">Supplier and purchase order overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total suppliers" value={supplierTotals?.totalSuppliers} icon={Building2} />
        <StatCard label="Pending PO" value={purchaseTotals?.pendingPO} icon={Clock} tone="warning" />
        <StatCard label="Pending GRN" value={purchaseTotals?.pendingGRN} icon={Truck} tone="warning" />
        <StatCard label="Outstanding payments" value={supplierTotals?.outstandingPayments} icon={IndianRupee} format={formatCurrency} tone="destructive" />
        <StatCard label="Purchase value" value={purchaseTotals?.purchaseValue} icon={ShoppingBag} format={formatCurrency} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase trend (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend ?? []} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={formatCurrency} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--border)' }} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3, fill: CHART_COLOR }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier performance</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pt-2">
          {performanceChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <PackageCheck className="mr-2 size-4" /> No completed purchase orders yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={formatCurrency} />
                <Tooltip content={<SupplierTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="totalValue" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
