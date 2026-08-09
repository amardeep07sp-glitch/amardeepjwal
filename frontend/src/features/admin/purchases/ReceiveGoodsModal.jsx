import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useReceiveGoods } from './goodsReceiptNotesApi';

// One row per PurchaseItem still pending receipt - defaults every quantity
// to its full pendingQuantity (the common "Full Receive" case), editable
// down for a "Partial Receive". Rows already fully received (pendingQuantity
// 0) are never shown - there's nothing left to receive against them.
export function ReceiveGoodsModal({ purchaseOrderId, items, open, onOpenChange }) {
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState('');
  const receiveGoods = useReceiveGoods();

  const pendingItems = items.filter((i) => i.pendingQuantity > 0);

  useEffect(() => {
    if (open) {
      setQuantities(Object.fromEntries(pendingItems.map((i) => [i.id, String(i.pendingQuantity)])));
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    const lines = pendingItems
      .map((i) => ({ purchaseItem: i.id, receivedQuantity: Number(quantities[i.id]) || 0 }))
      .filter((l) => l.receivedQuantity > 0);

    if (lines.length === 0) {
      toast.error('Enter at least one quantity to receive');
      return;
    }

    try {
      await receiveGoods.mutateAsync({ purchaseOrderId, items: lines, notes });
      toast.success('Goods received');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Receive goods"
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit} disabled={receiveGoods.isPending}>
            {receiveGoods.isPending ? 'Receiving...' : 'Receive goods'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {pendingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every line item on this order has already been fully received.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                <div>
                  <p className="font-medium text-heading">{item.productSnapshot?.name ?? item.sku}</p>
                  <p className="text-xs text-muted-foreground">SKU {item.sku} · {item.pendingQuantity} pending of {item.quantity}</p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={item.pendingQuantity}
                  className="w-24"
                  value={quantities[item.id] ?? ''}
                  onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}
        <FormField label="Notes">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. carrier, condition on arrival" />
        </FormField>
      </div>
    </Modal>
  );
}
