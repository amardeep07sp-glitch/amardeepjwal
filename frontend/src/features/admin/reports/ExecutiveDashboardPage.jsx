import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IndianRupee, TrendingDown, TrendingUp, ShoppingCart, Package, Boxes, Users, Building2, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useExecutiveDashboardCards, useExecutiveDashboardCharts } from './reportsApi';

const CHART_COLOR = '#c8a24a';
const GRID_STROKE = 'var(--border)';
const AXIS_TEXT_CLASS = 'fill-muted-foreground text-xs';
const INCOME_COLOR = 'var(--success)';
const EXPENSE_COLOR = 'var(--destructive)';

const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: Math.abs(value ?? 0) >= 100000 ? 'compact' : 'standard' }).format(value ?? 0);
const formatCurrency = (value) => `₹${formatCompact(value)}`;

function StatCard({ label, value, icon: Icon, tone = 'default', format = formatCurrency }) {
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

function LineChartCard({ title, data, dataKey, valueFormatter = formatCurrency, dateKey = 'date' }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data ?? []} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey={dateKey} axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
            <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={valueFormatter} />
            <Tooltip
              cursor={{ stroke: 'var(--border)' }}
              contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(value) => valueFormatter(value)}
              labelFormatter={(d) => new Date(d).toLocaleDateString()}
            />
            <Line type="monotone" dataKey={dataKey} stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3, fill: CHART_COLOR }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function BarRankingCard({ title, data, dataKey = 'revenue' }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data ?? []} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={formatCurrency} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(value) => formatCurrency(value)}
            />
            <Bar dataKey={dataKey} fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function ExecutiveDashboardPage() {
  const { data: cards, isLoading, error, refetch } = useExecutiveDashboardCards();
  const { data: charts } = useExecutiveDashboardCharts(14);

  if (isLoading) return <PageLoader label="Loading executive dashboard..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">The whole business, one screen - reused from every module's own numbers.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Revenue (MTD)" value={cards?.revenue} icon={TrendingUp} tone="success" />
        <StatCard label="Profit (MTD)" value={cards?.profit} icon={IndianRupee} tone={cards?.profit >= 0 ? 'success' : 'destructive'} />
        <StatCard label="Expenses (MTD)" value={cards?.expenses} icon={TrendingDown} tone="destructive" />
        <StatCard label="Sales (MTD)" value={cards?.sales} icon={ShoppingCart} format={formatCompact} />
        <StatCard label="Purchases (MTD)" value={cards?.purchases} icon={Package} tone="warning" />
        <StatCard label="Inventory Value" value={cards?.inventoryValue} icon={Boxes} />
        <StatCard label="Receivables" value={cards?.outstandingReceivables} icon={Users} tone="warning" />
        <StatCard label="Payables" value={cards?.outstandingPayables} icon={Building2} tone="warning" />
        <StatCard label="Wallet Balance" value={cards?.walletBalance} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard title="Sales Trend (14 days)" data={charts?.salesTrend} dataKey="revenue" />
        <LineChartCard title="Purchase Trend (14 days)" data={charts?.purchaseTrend} dataKey="value" />
        <LineChartCard title="Profit Trend (14 days)" data={charts?.profitTrend} dataKey="profit" />

        <Card>
          <CardHeader><CardTitle>Cash Flow (14 days)</CardTitle></CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.cashFlow ?? []} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={formatCurrency} />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => formatCurrency(value)}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="netFlow" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false}>
                  {(charts?.cashFlow ?? []).map((entry, index) => (
                    <Cell key={index} fill={entry.netFlow >= 0 ? INCOME_COLOR : EXPENSE_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <BarRankingCard title="Top Categories" data={charts?.topCategories} />
        <BarRankingCard title="Top Products" data={charts?.topProducts} />
      </div>
    </div>
  );
}
