import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PURCHASE_PAYMENT_METHOD_LABELS } from './purchaseSchema';
import { useRecordSupplierPayment } from './supplierPaymentsApi';

export function RecordSupplierPaymentModal({ supplierId, purchaseOrderId, open, onOpenChange, suggestedAmount }) {
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState(suggestedAmount ? String(suggestedAmount) : '');
  const [transactionReference, setTransactionReference] = useState('');
  const recordPayment = useRecordSupplierPayment();

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await recordPayment.mutateAsync({ supplierId, purchaseOrder: purchaseOrderId, method, amount: Number(amount), transactionReference });
      toast.success('Payment recorded');
      onOpenChange(false);
      setAmount('');
      setTransactionReference('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Record supplier payment"
      className="sm:max-w-sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={recordPayment.isPending}>
            {recordPayment.isPending ? 'Recording...' : 'Record payment'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Method" required>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PURCHASE_PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Amount" required>
          <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormField>
        <FormField label="Reference" description="Optional - UTR, cheque number, etc.">
          <Input value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
