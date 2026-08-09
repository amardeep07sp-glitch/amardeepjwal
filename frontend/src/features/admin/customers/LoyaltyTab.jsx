import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useLoyalty, useLoyaltyLedger, useRecordLoyaltyTransaction } from './loyaltyApi';
import { LOYALTY_TXN_TYPE_LABELS, LOYALTY_TIER_LABELS, LOYALTY_TIER_BADGE_VARIANTS } from './customerSchema';

export function LoyaltyTab({ customerId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState('earn');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');

  const { data: loyalty } = useLoyalty(customerId);
  const { data: ledgerData } = useLoyaltyLedger(customerId, { limit: 20 });
  const recordTransaction = useRecordLoyaltyTransaction();

  const entries = ledgerData?.items ?? [];

  const handleSubmit = async () => {
    if (!points || Number(points) === 0) {
      toast.error('Enter a non-zero points value');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    try {
      await recordTransaction.mutateAsync({ customerId, type, points: Number(points), reason: reason.trim() });
      toast.success('Loyalty transaction recorded');
      setModalOpen(false);
      setPoints('');
      setReason('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current points</p>
            <p className="text-2xl font-semibold text-heading">{loyalty?.currentPoints ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tier</p>
            <Badge variant={LOYALTY_TIER_BADGE_VARIANTS[loyalty?.currentTier] ?? 'secondary'} className="capitalize">
              {LOYALTY_TIER_LABELS[loyalty?.currentTier] ?? 'Silver'}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lifetime earned</p>
            <p className="text-lg font-medium text-heading">{loyalty?.lifetimePointsEarned ?? 0}</p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>Record transaction</Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState title="No transactions yet" description="Points earned, redeemed, or adjusted will appear here." />
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-heading">{LOYALTY_TXN_TYPE_LABELS[entry.type] ?? entry.type}</span>{' '}
                <span className="text-muted-foreground">— {entry.reason}</span>
              </div>
              <div className="text-right">
                <p className={entry.points >= 0 ? 'text-success' : 'text-destructive'}>
                  {entry.points >= 0 ? '+' : ''}
                  {entry.points}
                </p>
                <p className="text-xs text-muted-foreground">Balance: {entry.balanceAfter}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Record loyalty transaction"
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
                {Object.entries(LOYALTY_TXN_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Points" required description={type === 'adjust' ? 'Can be negative for a correction' : undefined}>
            <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
          </FormField>
          <FormField label="Reason" required>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
