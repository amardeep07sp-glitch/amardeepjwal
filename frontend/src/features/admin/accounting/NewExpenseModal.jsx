import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpenseCategories } from './expenseCategoriesApi';
import { useCreateExpense } from './expensesApi';
import { EXPENSE_PAYMENT_METHOD_LABELS } from './accountingSchema';

const EMPTY_FORM = { category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10), method: 'cash' };

export function NewExpenseModal({ open, onOpenChange }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const { data: categories } = useExpenseCategories();
  const createExpense = useCreateExpense();

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.category) {
      toast.error('Select a category');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await createExpense.mutateAsync({ ...form, amount: Number(form.amount) });
      toast.success('Expense submitted for approval');
      setForm(EMPTY_FORM);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Submit expense"
      className="sm:max-w-sm"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createExpense.isPending}>{createExpense.isPending ? 'Submitting...' : 'Submit'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Category" required>
          <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Amount" required>
          <Input type="number" min={0} value={form.amount} onChange={setField('amount')} />
        </FormField>
        <FormField label="Date">
          <Input type="date" value={form.date} onChange={setField('date')} />
        </FormField>
        <FormField label="Method">
          <Select value={form.method} onValueChange={(v) => setForm((p) => ({ ...p, method: v }))}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(EXPENSE_PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Description">
          <Textarea rows={2} value={form.description} onChange={setField('description')} />
        </FormField>
      </div>
    </Modal>
  );
}
