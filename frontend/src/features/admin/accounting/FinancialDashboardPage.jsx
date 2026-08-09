import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IndianRupee, TrendingDown, TrendingUp, Users, Building2, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useFinancialDashboardTotals, useIncomeVsExpenseTrend, useCashFlowTrend } from './financialDashboardApi';

const GRID_STROKE = 'var(--border)';
const AXIS_TEXT_CLASS = 'fill-muted-foreground text-xs';
// Income/Expense map onto the app's existing good/bad semantic tokens
// (not an arbitrary categorical pair) - the same reasoning that lets a
// status palette be reused for a two-series good-vs-bad framing rather
// than inventing a new categorical pair for just this one chart.
const INCOME_COLOR = 'var(--success)';
const EXPENSE_COLOR = 'var(--destructive)';

const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: Math.abs(value) >= 100000 ? 'compact' : 'standard' }).format(value ?? 0);
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

function IncomeExpenseTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-heading">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value)}</p>
      ))}
    </div>
  );
}

function CashFlowTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-heading">{new Date(label).toLocaleDateString()}</p>
      <p className={value >= 0 ? 'text-success' : 'text-destructive'}>{value >= 0 ? 'Net inflow' : 'Net outflow'}: {formatCurrency(value)}</p>
    </div>
  );
}

export default function FinancialDashboardPage() {
  const { data: totals, isLoading, error, refetch } = useFinancialDashboardTotals();
  const { data: incomeVsExpense } = useIncomeVsExpenseTrend(6);
  const { data: cashFlow } = useCashFlowTrend(14);

  if (isLoading) return <PageLoader label="Loading financial dashboard..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Financial Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live revenue, expense, and cash position.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue (MTD)" value={totals?.revenue} icon={TrendingUp} tone="success" />
        <StatCard label="Expenses (MTD)" value={totals?.expenses} icon={TrendingDown} tone="destructive" />
        <StatCard label="Profit (MTD)" value={totals?.profit} icon={IndianRupee} tone={totals?.profit >= 0 ? 'success' : 'destructive'} />
        <StatCard label="Receivables" value={totals?.receivables} icon={Users} tone="warning" />
        <StatCard label="Payables" value={totals?.payables} icon={Building2} tone="warning" />
        <StatCard label="Cash" value={totals?.cash} icon={Wallet} />
      </div>

      <Card>
        <CardHeader><CardTitle>Income vs Expense (last 6 months)</CardTitle></CardHeader>
        <CardContent className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpense ?? []} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} tickFormatter={(m) => new Date(`${m}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })} />
              <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={formatCurrency} />
              <Tooltip content={<IncomeExpenseTooltip />} cursor={{ fill: 'var(--muted)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
              <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cash flow (last 14 days)</CardTitle></CardHeader>
        <CardContent className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlow ?? []} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <YAxis axisLine={false} tickLine={false} className={AXIS_TEXT_CLASS} width={56} tickFormatter={formatCurrency} />
              <Tooltip content={<CashFlowTooltip />} cursor={{ fill: 'var(--muted)' }} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="netFlow" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false}>
                {(cashFlow ?? []).map((entry, index) => (
                  <Cell key={index} fill={entry.netFlow >= 0 ? INCOME_COLOR : EXPENSE_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
