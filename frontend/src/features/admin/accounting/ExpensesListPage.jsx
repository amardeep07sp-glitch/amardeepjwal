import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useExpenses, useApproveExpense, useRejectExpense } from './expensesApi';
import { EXPENSE_STATUS_LABELS, EXPENSE_STATUS_BADGE_VARIANTS, EXPENSE_PAYMENT_METHOD_LABELS } from './accountingSchema';
import { NewExpenseModal } from './NewExpenseModal';
import { ExpenseCategoriesTab } from './ExpenseCategoriesTab';

const STATUS_FILTER_ALL = 'all';

function ExpensesTab() {
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useExpenses({
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: status === STATUS_FILTER_ALL ? undefined : status,
  });
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const runAction = async (mutation, payload, message) => {
    try {
      await mutation.mutateAsync(payload);
      toast.success(message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'date', header: 'Date', render: (e) => new Date(e.date).toLocaleDateString() },
    { key: 'category', header: 'Category', render: (e) => e.category?.name ?? '—' },
    { key: 'description', header: 'Description', render: (e) => e.description || '—' },
    { key: 'method', header: 'Method', render: (e) => EXPENSE_PAYMENT_METHOD_LABELS[e.method] ?? e.method },
    { key: 'amount', header: 'Amount', render: (e) => `₹${e.amount.toFixed(2)}` },
    { key: 'status', header: 'Status', render: (e) => <Badge variant={EXPENSE_STATUS_BADGE_VARIANTS[e.status]} className="capitalize">{EXPENSE_STATUS_LABELS[e.status]}</Badge> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-40',
      render: (e) =>
        e.status === 'pending' ? (
          <div className="flex gap-1">
            <Button size="sm" onClick={() => runAction(approveExpense, e.id, 'Expense approved and posted')}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => runAction(rejectExpense, { id: e.id }, 'Expense rejected')}>Reject</Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><Plus /> Submit expense</Button>
      </div>
      <DataTable
        columns={columns}
        data={items}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        toolbarActions={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {Object.entries(EXPENSE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No expenses yet"
        emptyDescription="Submitted expenses appear here, pending approval."
        pagination={{ page: meta.page, totalPages: meta.totalPages, totalItems: meta.totalItems, pageSize: DEFAULT_PAGE_SIZE, onPageChange: setPage }}
      />
      <NewExpenseModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

export default function ExpensesListPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Expenses</h1>
        <p className="text-sm text-muted-foreground">Submitted expenses post a journal only once approved.</p>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="pt-4">
          <ExpensesTab />
        </TabsContent>
        <TabsContent value="categories" className="pt-4">
          <ExpenseCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
