import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PURCHASE_RETURN_ACTION_LABELS } from './purchaseSchema';
import { useRequestPurchaseReturn } from './purchaseReturnsApi';

// One row per line item with something available to return
// (receivedQuantity - returnedQuantity > 0) - defaults every quantity to 0
// so the buyer explicitly opts each line in, rather than every received
// item being returned by default.
export function RequestPurchaseReturnModal({ purchaseOrderId, items, open, onOpenChange }) {
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('refund');
  const requestReturn = useRequestPurchaseReturn();

  const returnableItems = items.filter((i) => i.receivedQuantity - i.returnedQuantity > 0);

  useEffect(() => {
    if (open) {
      setQuantities({});
      setReason('');
      setAction('refund');
    }
  }, [open]);

  const handleSubmit = async () => {
    const lines = returnableItems
      .map((i) => ({ purchaseItem: i.id, quantity: Number(quantities[i.id]) || 0 }))
      .filter((l) => l.quantity > 0);

    if (lines.length === 0) {
      toast.error('Enter at least one quantity to return');
      return;
    }

    try {
      await requestReturn.mutateAsync({ purchaseOrderId, items: lines, reason, action });
      toast.success('Return requested');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Request return to supplier"
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={requestReturn.isPending}>
            {requestReturn.isPending ? 'Requesting...' : 'Request return'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {returnableItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No received quantity is available to return on this order.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {returnableItems.map((item) => {
              const available = item.receivedQuantity - item.returnedQuantity;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium text-heading">{item.productSnapshot?.name ?? item.sku}</p>
                    <p className="text-xs text-muted-foreground">SKU {item.sku} · {available} available to return</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={available}
                    className="w-24"
                    value={quantities[item.id] ?? ''}
                    onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                </div>
              );
            })}
          </div>
        )}

        <FormField label="Action" required>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PURCHASE_RETURN_ACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Reason">
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. damaged in transit, wrong item" />
        </FormField>
      </div>
    </Modal>
  );
}
