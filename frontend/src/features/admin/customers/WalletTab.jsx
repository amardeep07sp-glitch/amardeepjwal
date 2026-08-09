import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useWallet, useWalletLedger, useRecordWalletTransaction } from './walletApi';
import { WALLET_TXN_TYPE_LABELS } from './customerSchema';

export function WalletTab({ customerId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const { data: wallet } = useWallet(customerId);
  const { data: ledgerData } = useWalletLedger(customerId, { limit: 20 });
  const recordTransaction = useRecordWalletTransaction();

  const entries = ledgerData?.items ?? [];

  const handleSubmit = async () => {
    if (!amount || Number(amount) === 0) {
      toast.error('Enter a non-zero amount');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    try {
      await recordTransaction.mutateAsync({ customerId, type, amount: Number(amount), reason: reason.trim() });
      toast.success('Wallet transaction recorded');
      setModalOpen(false);
      setAmount('');
      setReason('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm text-muted-foreground">Wallet balance</p>
          <p className="text-2xl font-semibold text-heading">₹{(wallet?.balance ?? 0).toFixed(2)}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Record transaction</Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState title="No transactions yet" description="Wallet credits, debits, and refunds will appear here." />
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-heading">{WALLET_TXN_TYPE_LABELS[entry.type] ?? entry.type}</span>{' '}
                <span className="text-muted-foreground">— {entry.reason}</span>
              </div>
              <div className="text-right">
                <p className={entry.amount >= 0 ? 'text-success' : 'text-destructive'}>
                  {entry.amount >= 0 ? '+' : ''}
                  {entry.amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Balance: {entry.balanceAfter.toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Record wallet transaction"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={recordTransaction.isPending}>
              {recordTransaction.isPending ? 'Recording...' : 'Record'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Type" required>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(WALLET_TXN_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Amount" required description={type === 'adjustment' ? 'Can be negative for a correction' : undefined}>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormField>
          <FormField label="Reason" required>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
