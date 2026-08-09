import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateRefund } from './orderRefundsApi';

export function CreateRefundModal({ orderId, maxRefundable, open, onOpenChange }) {
  const [type, setType] = useState('full');
  const [amount, setAmount] = useState(maxRefundable ? String(maxRefundable) : '');
  const [method, setMethod] = useState('');
  const createRefund = useCreateRefund();

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await createRefund.mutateAsync({ orderId, type, amount: Number(amount), method });
      toast.success('Refund created - process it once the money has actually moved');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create refund"
      className="sm:max-w-sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createRefund.isPending}>
            {createRefund.isPending ? 'Creating...' : 'Create refund'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Type" required>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Amount" required description={maxRefundable ? `Max refundable: ${maxRefundable}` : undefined}>
          <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormField>
        <FormField label="Method" description="e.g. UPI, Bank Transfer, Razorpay">
          <Input value={method} onChange={(e) => setMethod(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
