import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRequestReturn } from './orderReturnsApi';

// `items` should already be filtered to returnable (delivered) OrderItems.
export function RequestReturnModal({ orderId, items, open, onOpenChange }) {
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState('');
  const requestReturn = useRequestReturn();

  const setQuantity = (itemId, value) => setQuantities((prev) => ({ ...prev, [itemId]: value }));

  const handleSubmit = async () => {
    const returnItems = Object.entries(quantities)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([orderItem, qty]) => ({ orderItem, returnQuantity: Number(qty) }));

    if (returnItems.length === 0) {
      toast.error('Enter a return quantity for at least one item');
      return;
    }
    try {
      await requestReturn.mutateAsync({ orderId, items: returnItems, reason });
      toast.success('Return requested');
      onOpenChange(false);
      setQuantities({});
      setReason('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Request return"
      className="sm:max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={requestReturn.isPending}>
            {requestReturn.isPending ? 'Requesting...' : 'Request return'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Items to return">
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {item.productSnapshot?.name ?? item.sku} (delivered x{item.quantity})
                </span>
                <Input
                  type="number"
                  min={0}
                  max={item.quantity}
                  className="w-20"
                  value={quantities[item.id] ?? ''}
                  onChange={(e) => setQuantity(item.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </FormField>
        <FormField label="Reason">
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
