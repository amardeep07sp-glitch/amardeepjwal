import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Gem,
  ShoppingCart,
  Users,
  Truck,
  Landmark,
  BarChart3,
  Radar,
  Boxes,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Activity,
  Percent,
  Eye,
  ChevronRight,
  Clock,
  ListFilter,
  FilePlus2,
  Pencil,
  Trash2,
  RefreshCw,
  UserCheck,
  Star,
  User,
  LifeBuoy,
  HelpCircle,
  CalendarDays,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/global/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useExecutiveDashboardCards } from '@/features/admin/reports/reportsApi';
import { useCipDashboardCards } from '@/features/admin/cip/cipApi';

// Mirrors backend/src/constants/roles.js's PRIVILEGED_ROLES - the
// Executive Dashboard cards and Recent Activity feed both require it
// server-side (Phase 11/Activity Log RBAC), so the query is never even
// fired for a Staff/Viewer login rather than firing and swallowing a 403.
const PRIVILEGED_ROLES = ['super_admin', 'admin', 'manager'];

const QUICK_LINKS = [
  { label: 'Products', description: 'Catalog & pricing', path: '/admin/catalog/products', icon: Gem },
  { label: 'Orders', description: 'Sales & fulfillment', path: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', description: 'CRM, wallet & loyalty', path: '/admin/customers', icon: Users },
  { label: 'Inventory', description: 'Stock & warehouses', path: '/admin/inventory/dashboard', icon: Boxes },
  { label: 'Suppliers', description: 'Purchase orders & GRN', path: '/admin/purchase-orders', icon: Truck },
  { label: 'Accounting', description: 'Journals & ledgers', path: '/admin/accounting/dashboard', icon: Landmark },
  { label: 'Reports Center', description: 'Every business report', path: '/admin/reports/center', icon: BarChart3 },
  { label: 'Customer Intelligence', description: 'Visitors, funnels & journeys', path: '/admin/cip/dashboard', icon: Radar },
];

const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: Math.abs(value ?? 0) >= 100000 ? 'compact' : 'standard' }).format(value ?? 0);
const formatCurrency = (value) => `₹${formatCompact(value)}`;

function StatCard({ label, value, icon: Icon, tone = 'default', format = (v) => v ?? 0 }) {
  const toneClasses = {
    default: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
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

function QuickLinkCard({ label, description, path, icon: Icon }) {
  return (
    <Link to={path} className="group">
      <Card size="sm" className="h-full transition-colors group-hover:border-primary/50">
        <CardContent className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate font-medium text-heading">{label}</p>
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}

function formatActivityLine(entry) {
  const action = entry.action?.replace(/[._]/g, ' ') ?? 'activity';
  const who = entry.performedBy?.name ?? 'System';
  return { action, who };
}

// Real module values this app's own activityLogService.record() calls use
// (grepped across backend/src/modules) - never a guessed/invented list.
const MODULE_OPTIONS = [
  'accounting',
  'Banner',
  'Brand',
  'Category',
  'Collection',
  'customer',
  'Homepage',
  'help',
  'issue',
  'order',
  'Product',
  'review',
  'Settings',
  'support',
  'supplier',
  'Variant',
];

// Module wins over action when both could apply (e.g. a 'review' module
// entry always gets the star, regardless of its action verb) - falls back
// to the action verb, then a generic activity pulse.
const MODULE_ICON = {
  customer: User,
  review: Star,
  order: ShoppingCart,
  Product: Gem,
  support: LifeBuoy,
  issue: LifeBuoy,
  help: HelpCircle,
  supplier: Truck,
  accounting: Landmark,
};

function activityIcon(entry) {
  if (MODULE_ICON[entry.module]) return MODULE_ICON[entry.module];
  const action = entry.action ?? '';
  if (action.includes('created')) return FilePlus2;
  if (action.includes('deleted')) return Trash2;
  if (action.includes('assigned')) return UserCheck;
  if (action.includes('status') || action.includes('changed')) return RefreshCw;
  if (action.includes('updated')) return Pencil;
  return Activity;
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
const startOfWeek = (d) => {
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return startOfDay(monday);
};

function RecentActivityCard({ enabled }) {
  const [moduleFilter, setModuleFilter] = useState(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-recent-activity', moduleFilter],
    queryFn: async () => (await api.get('/activity-logs', { params: { page: 1, limit: 8, module: moduleFilter } })).data,
    enabled,
  });

  // Real counts, not derived from the 8-row page above (which would
  // undercount once a store has more than 8 activities in a day) - two
  // cheap limit:1 requests just to read their real `meta.totalItems`.
  const { data: todayData } = useQuery({
    queryKey: ['dashboard-activity-count', 'today'],
    queryFn: async () => (await api.get('/activity-logs', { params: { page: 1, limit: 1, dateFrom: startOfDay(new Date()) } })).data,
    enabled,
  });
  const { data: weekData } = useQuery({
    queryKey: ['dashboard-activity-count', 'week'],
    queryFn: async () => (await api.get('/activity-logs', { params: { page: 1, limit: 1, dateFrom: startOfWeek(new Date()) } })).data,
    enabled,
  });

  if (!enabled) return null;

  const items = data?.items ?? [];

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex! flex-row items-center justify-between border-b border-border pb-(--card-spacing)">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="size-5" />
          </span>
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <p className="text-xs text-muted-foreground">Stay updated with the latest actions in your store</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ListFilter className="size-3.5" /> {moduleFilter ?? 'Filter'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
            <DropdownMenuItem onSelect={() => setModuleFilter(undefined)}>All Activity</DropdownMenuItem>
            {MODULE_OPTIONS.map((m) => (
              <DropdownMenuItem key={m} onSelect={() => setModuleFilter(m)}>
                {m}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-(--card-spacing)">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <EmptyState title="No activity yet" description="Actions across every module will show up here." />
        ) : (
          <ul className="flex flex-col">
            {items.map((entry, index) => {
              const { action, who } = formatActivityLine(entry);
              const Icon = activityIcon(entry);
              const isLast = index === items.length - 1;
              return (
                <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast && <span className="absolute top-12 bottom-0 left-6 border-l-2 border-dashed border-border" />}
                  <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-card">
                    <Icon className="size-5" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-heading capitalize">
                        {action}
                        {entry.entityName ? ` · ${entry.entityName}` : ''}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{who}</p>
                      <Badge variant="secondary" className="mt-1 gap-1 text-[10px] capitalize">
                        <User className="size-2.5" /> {entry.module}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
                      <Clock className="size-3" /> {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        {[
          { label: 'Total Activities', value: data?.meta?.totalItems, icon: Activity },
          { label: 'Today', value: todayData?.meta?.totalItems, icon: CalendarDays },
          { label: 'This Week', value: weekData?.meta?.totalItems, icon: Clock },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-4 py-3">
            <stat.icon className="size-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-base font-semibold text-heading">{stat.value ?? 0}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isPrivileged = PRIVILEGED_ROLES.includes(user?.role);

  const { data: execCards } = useExecutiveDashboardCards({ enabled: isPrivileged });
  const { data: cipCards } = useCipDashboardCards();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening across the business right now.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {isPrivileged && (
          <>
            <StatCard label="Revenue (MTD)" value={execCards?.revenue} icon={TrendingUp} tone="success" format={formatCurrency} />
            <StatCard label="Profit (MTD)" value={execCards?.profit} icon={IndianRupee} tone={execCards?.profit >= 0 ? 'success' : 'destructive'} format={formatCurrency} />
            <StatCard label="Expenses (MTD)" value={execCards?.expenses} icon={TrendingDown} tone="warning" format={formatCurrency} />
          </>
        )}
        <StatCard label="Realtime Visitors" value={cipCards?.realtimeVisitors} icon={Eye} tone="success" />
        <StatCard label="Active Sessions" value={cipCards?.activeSessions} icon={Activity} tone="success" />
        <StatCard label="Conversion Rate" value={cipCards?.conversionRate} icon={Percent} tone="warning" format={(v) => `${v ?? 0}%`} />
        <StatCard label="Your Role" value={user?.role?.replace('_', ' ')} icon={Users} format={(v) => <span className="capitalize">{v}</span>} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick links</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <QuickLinkCard key={link.path} {...link} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RecentActivityCard enabled={isPrivileged} />

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary" className="capitalize">
                {user?.role?.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
