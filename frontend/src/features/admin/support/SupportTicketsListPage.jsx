import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Flame, UserX, Clock, Eye } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useTickets, useTicketDashboard } from './supportApi';
import { TICKET_CATEGORIES, TICKET_STATUS_VARIANTS, PRIORITY_BADGE_VARIANTS } from './supportSchema';

const STATUS_TABS = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Waiting on Customer', value: 'waiting_for_customer' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: undefined },
];

const categoryLabel = (value) => TICKET_CATEGORIES.find((c) => c.value === value)?.label ?? value;

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
          <p className="text-2xl font-semibold text-heading">{value ?? '-'}</p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

const formatDate = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function SupportTicketsListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('open');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  const { data: counts } = useTicketDashboard();
  const { data, isLoading, error, refetch } = useTickets({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status,
    category: category === 'all' ? undefined : category,
  });

  const tickets = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    {
      key: 'ticketNumber',
      header: 'Ticket',
      render: (t) => (
        <div>
          <span className="font-mono text-sm font-semibold text-heading">{t.ticketNumber}</span>
          <p className="mt-0.5 max-w-64 truncate text-xs text-muted-foreground">{t.subject}</p>
        </div>
      ),
    },
    { key: 'customer', header: 'Customer', render: (t) => t.customer?.name ?? '-' },
    { key: 'category', header: 'Category', render: (t) => categoryLabel(t.category) },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <Badge variant={PRIORITY_BADGE_VARIANTS[t.priority] ?? 'secondary'} className="capitalize">
          {t.priority}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <Badge variant={TICKET_STATUS_VARIANTS[t.status] ?? 'secondary'} className="capitalize">
          {t.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { key: 'assignedAgent', header: 'Agent', render: (t) => t.assignedAgent?.name ?? <span className="text-muted-foreground">Unassigned</span> },
    { key: 'createdAt', header: 'Created', render: (t) => <span className="text-sm text-muted-foreground">{formatDate(t.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-16',
      render: (t) => (
        <Button variant="ghost" size="icon-sm" aria-label={`View ${t.ticketNumber}`} onClick={() => navigate(`/admin/support/tickets/${t.id}`)}>
          <Eye className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">Customer support requests, assigned and resolved by your team.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Open / In Progress" value={counts?.open} icon={Inbox} />
        <StatCard label="Urgent" value={counts?.urgent} icon={Flame} tone="destructive" />
        <StatCard label="Unassigned" value={counts?.unassigned} icon={UserX} tone="warning" />
        <StatCard label="Waiting on Customer" value={counts?.waitingForCustomer} icon={Clock} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {TICKET_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No tickets here"
        emptyDescription="Support tickets will show up here once customers raise them."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
