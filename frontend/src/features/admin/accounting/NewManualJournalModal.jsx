import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllAccounts } from './accountsApi';
import { useCreateManualJournal } from './journalsApi';

const EMPTY_LINE = { account: '', side: 'debit', amount: '' };

export function NewManualJournalModal({ open, onOpenChange }) {
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const { data: accounts } = useAllAccounts();
  const createManualJournal = useCreateManualJournal();

  const reset = () => {
    setNarration('');
    setLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  };

  const updateLine = (index, patch) => setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const totalDebit = lines.reduce((sum, l) => sum + (l.side === 'debit' ? Number(l.amount) || 0 : 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.side === 'credit' ? Number(l.amount) || 0 : 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async () => {
    if (!narration.trim()) {
      toast.error('Narration is required');
      return;
    }
    if (!isBalanced) {
      toast.error('Total debit must equal total credit (and be greater than zero)');
      return;
    }
    if (lines.some((l) => !l.account || !l.amount)) {
      toast.error('Every line needs an account and amount');
      return;
    }

    try {
      await createManualJournal.mutateAsync({
        narration,
        lines: lines.map((l) => ({
          account: l.account,
          debit: l.side === 'debit' ? Number(l.amount) : 0,
          credit: l.side === 'credit' ? Number(l.amount) : 0,
        })),
      });
      toast.success('Journal posted');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New manual journal"
      className="sm:max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={createManualJournal.isPending}>
            {createManualJournal.isPending ? 'Posting...' : 'Post journal'}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <FormField label="Narration" required>
          <Textarea rows={2} value={narration} onChange={(e) => setNarration(e.target.value)} />
        </FormField>

        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-heading">Lines</p>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="size-4" /> Add line
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-[1fr_100px_100px_auto] items-center gap-2">
                <Select value={line.account} onValueChange={(v) => updateLine(index, { account: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Account" /></SelectTrigger>
                  <SelectContent>
                    {(accounts ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={line.side} onValueChange={(v) => updateLine(index, { side: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={0} value={line.amount} onChange={(e) => updateLine(index, { amount: e.target.value })} />
                <Button variant="ghost" size="icon-sm" aria-label="Remove line" onClick={() => removeLine(index)} disabled={lines.length <= 2}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className={`mt-3 flex justify-between rounded-md px-3 py-2 text-sm ${isBalanced ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
            <span>Total Debit: ₹{totalDebit.toFixed(2)}</span>
            <span>Total Credit: ₹{totalCredit.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
