import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useAuthStore } from '@/store/authStore';
import { STAFF_ROLES, ROLE_LABELS, ROLES } from '@/constants/roles';
import { useStaffList, useUpdateStaff } from './staffApi';
import { StaffFormModal } from './StaffFormModal';

const ROLE_BADGE_VARIANT = {
  [ROLES.SUPER_ADMIN]: 'destructive',
  [ROLES.ADMIN]: 'default',
  [ROLES.MANAGER]: 'secondary',
};

// Real staff account management (Admin -> Settings -> Staff, Super Admin
// only - backend/src/modules/auth/auth.routes.js's #createStaff/#updateStaff
// are gated the same way) - this is what actually replaced the admin
// panel's old public self-registration form. Role and active/inactive are
// editable inline right in the table (the only two fields updateStaffUser
// ever touches); a brand-new account only ever comes from "+ Add Staff".
export default function StaffListPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  const { data, isLoading, error, refetch } = useStaffList({ page, limit: DEFAULT_PAGE_SIZE, search: search || undefined });
  const updateStaff = useUpdateStaff();

  const staff = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleRoleChange = async (member, role) => {
    try {
      await updateStaff.mutateAsync({ id: member.id, payload: { role } });
      toast.success(`${member.name}'s role updated to ${ROLE_LABELS[role]}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = (member, nextActive) => {
    // Deactivating is the one destructive-ish direction here (signs them
    // out of everything, blocks login) - reactivating is harmless, so only
    // the OFF direction gets a confirm step.
    if (!nextActive) {
      setPendingDeactivate(member);
      return;
    }
    updateStaff.mutate(
      { id: member.id, payload: { isActive: true } },
      { onSuccess: () => toast.success(`${member.name} reactivated`), onError: (err) => toast.error(err.message) }
    );
  };

  const confirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    try {
      await updateStaff.mutateAsync({ id: pendingDeactivate.id, payload: { isActive: false } });
      toast.success(`${pendingDeactivate.name} deactivated`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPendingDeactivate(null);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (m) => <span className="font-medium text-heading">{m.name}</span> },
    {
      key: 'contact',
      header: 'Contact',
      render: (m) => (
        <div className="flex flex-col text-sm">
          <span className="text-foreground">{m.email}</span>
          {m.phone && <span className="text-xs text-muted-foreground">{m.phone}</span>}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) =>
        m.id === currentUser?.id ? (
          <Badge variant={ROLE_BADGE_VARIANT[m.role] ?? 'outline'}>{ROLE_LABELS[m.role] ?? m.role}</Badge>
        ) : (
          <Select value={m.role} onValueChange={(role) => handleRoleChange(m, role)}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
    },
    {
      key: 'status',
      header: 'Active',
      render: (m) =>
        m.id === currentUser?.id ? (
          <span className="text-xs text-muted-foreground">This is you</span>
        ) : (
          <Switch checked={m.isActive} onCheckedChange={(checked) => handleToggleActive(m, checked)} />
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Staff Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage admin panel logins - there's no public sign-up here on purpose, every account is provisioned by you.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="size-4" /> Add Staff
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={staff}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, or phone..."
        pagination={{ page: meta.page, totalPages: meta.totalPages, totalItems: meta.totalItems, onPageChange: setPage }}
        emptyTitle="No staff accounts yet"
        emptyDescription="Add your first staff account to get started."
      />

      <StaffFormModal open={isAddOpen} onOpenChange={setIsAddOpen} />

      <ConfirmDialog
        open={Boolean(pendingDeactivate)}
        onOpenChange={(open) => !open && setPendingDeactivate(null)}
        title="Deactivate this account?"
        description={pendingDeactivate ? `${pendingDeactivate.name} will be signed out and won't be able to log in until reactivated.` : ''}
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={updateStaff.isPending}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
