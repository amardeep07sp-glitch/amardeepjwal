import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useAllAccounts } from './accountsApi';
import { useExpenseCategories, useCreateExpenseCategory, useDeleteExpenseCategory } from './expenseCategoriesApi';

export function ExpenseCategoriesTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [defaultAccount, setDefaultAccount] = useState('');

  const { data: categories } = useExpenseCategories();
  const { data: accounts } = useAllAccounts('expense');
  const createCategory = useCreateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await createCategory.mutateAsync({ name: name.trim(), defaultAccount: defaultAccount || undefined });
      toast.success('Category added');
      setModalOpen(false);
      setName('');
      setDefaultAccount('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Category removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}><Plus /> New category</Button>
      </div>

      {!categories || categories.length === 0 ? (
        <EmptyState title="No expense categories yet" description="Add categories like Rent, Utilities, Salaries." />
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-heading">{c.name}</span>
                {c.defaultAccount && <span className="text-muted-foreground"> · posts to {c.defaultAccount.code} - {c.defaultAccount.name}</span>}
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => handleDelete(c.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="New expense category"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createCategory.isPending}>{createCategory.isPending ? 'Adding...' : 'Add category'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Default account" description="Falls back to General Operating Expenses if unset">
            <Select value={defaultAccount} onValueChange={setDefaultAccount}>
              <SelectTrigger className="w-full"><SelectValue placeholder="General Operating Expenses" /></SelectTrigger>
              <SelectContent>
                {(accounts ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
