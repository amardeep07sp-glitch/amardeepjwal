import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllAccounts, useCreateAccount, useUpdateAccount } from './accountsApi';
import { ACCOUNT_TYPE_LABELS } from './accountingSchema';

const EMPTY_FORM = { code: '', name: '', type: 'asset', parent: '', description: '', openingBalance: '0' };

export function AccountFormModal({ open, onOpenChange, account }) {
  const isEditMode = Boolean(account);
  const [form, setForm] = useState(EMPTY_FORM);
  const { data: parentCandidates } = useAllAccounts(form.type);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  useEffect(() => {
    if (account) {
      setForm({
        code: account.code ?? '',
        name: account.name ?? '',
        type: account.type ?? 'asset',
        parent: account.parent?.id ?? '',
        description: account.description ?? '',
        openingBalance: String(account.openingBalance ?? 0),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [account, open]);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and name are required');
      return;
    }

    const payload = { ...form, parent: form.parent || undefined, openingBalance: Number(form.openingBalance) || 0 };

    try {
      if (isEditMode) {
        await updateAccount.mutateAsync({ id: account.id, ...payload });
        toast.success('Account updated');
      } else {
        await createAccount.mutateAsync(payload);
        toast.success('Account created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createAccount.isPending || updateAccount.isPending;
  const parents = (parentCandidates ?? []).filter((a) => a.id !== account?.id);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit account' : 'New account'}
      className="sm:max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : isEditMode ? 'Save changes' : 'Create account'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Code" required>
            <Input value={form.code} onChange={setField('code')} disabled={account?.isSystem} />
          </FormField>
          <FormField label="Type" required>
            <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v, parent: '' }))} disabled={account?.isSystem}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="Name" required>
          <Input value={form.name} onChange={setField('name')} />
        </FormField>

        <FormField label="Parent account" description="Same type only">
          <Select value={form.parent} onValueChange={(v) => setForm((p) => ({ ...p, parent: v }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="No parent (top-level)" /></SelectTrigger>
            <SelectContent>
              {parents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {!isEditMode && (
          <FormField label="Opening balance" description="Posts a real Opening Balance journal entry">
            <Input type="number" value={form.openingBalance} onChange={setField('openingBalance')} />
          </FormField>
        )}

        <FormField label="Description">
          <Textarea rows={2} value={form.description} onChange={setField('description')} />
        </FormField>
      </div>
    </Modal>
  );
}
