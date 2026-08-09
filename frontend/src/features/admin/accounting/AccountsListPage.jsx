import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2, BookOpen, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useAccounts, useDeleteAccount } from './accountsApi';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_BADGE_VARIANTS } from './accountingSchema';
import { AccountFormModal } from './AccountFormModal';

const TYPE_FILTER_ALL = 'all';

export default function AccountsListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState(TYPE_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, error, refetch } = useAccounts({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
    type: type === TYPE_FILTER_ALL ? undefined : type,
  });
  const deleteAccount = useDeleteAccount();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync(deleteTarget.id);
      toast.success('Account deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'code', header: 'Code' },
    {
      key: 'name',
      header: 'Name',
      render: (a) => (
        <div className="flex items-center gap-2">
          {a.parent && <span className="text-muted-foreground">↳</span>}
          <span>{a.name}</span>
          {a.isSystem && <Lock className="size-3.5 text-muted-foreground" aria-label="System account" />}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (a) => <Badge variant={ACCOUNT_TYPE_BADGE_VARIANTS[a.type]} className="capitalize">{ACCOUNT_TYPE_LABELS[a.type]}</Badge>,
    },
    { key: 'currentBalance', header: 'Balance', render: (a) => `₹${a.currentBalance.toFixed(2)}` },
    { key: 'active', header: 'Status', render: (a) => <Badge variant={a.active ? 'success' : 'secondary'}>{a.active ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-28',
      render: (a) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="View ledger" onClick={() => navigate(`/admin/accounting/ledger?account=${a.id}`)}>
            <BookOpen className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => { setEditingAccount(a); setModalOpen(true); }}>
            <Pencil className="size-4" />
          </Button>
          {!a.isSystem && (
            <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setDeleteTarget(a)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground">Every ledger account the Financial Engine posts against.</p>
        </div>
        <Button onClick={() => { setEditingAccount(null); setModalOpen(true); }}>
          <Plus /> New account
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => { setSearchTerm(value); setPage(1); }}
        searchPlaceholder="Search by code or name..."
        toolbarActions={
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TYPE_FILTER_ALL}>All types</SelectItem>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No accounts yet"
        emptyDescription="System accounts are seeded automatically; add custom ones here."
        pagination={{ page: meta.page, totalPages: meta.totalPages, totalItems: meta.totalItems, pageSize: DEFAULT_PAGE_SIZE, onPageChange: setPage }}
      />

      <AccountFormModal open={modalOpen} onOpenChange={setModalOpen} account={editingAccount} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete account"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteAccount.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
