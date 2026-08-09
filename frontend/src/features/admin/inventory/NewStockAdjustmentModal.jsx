import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryPickerSelect } from './InventoryPickerSelect';
import { useCreateStockAdjustment } from './stockAdjustmentsApi';

export function NewStockAdjustmentModal({ open, onOpenChange }) {
  const [inventory, setInventory] = useState('');
  const [type, setType] = useState('increase');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const createAdjustment = useCreateStockAdjustment();

  const reset = () => {
    setInventory('');
    setType('increase');
    setQuantity('');
    setReason('');
  };

  const handleSubmit = async () => {
    if (!inventory || !quantity || !reason.trim()) {
      toast.error('Inventory record, quantity, and reason are all required');
      return;
    }
    try {
      await createAdjustment.mutateAsync({ inventory, type, quantity: Number(quantity), reason: reason.trim() });
      toast.success('Stock adjustment submitted');
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
      title="New stock adjustment"
      className="sm:max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createAdjustment.isPending}>
            {createAdjustment.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Inventory record" required>
          <InventoryPickerSelect value={inventory} onChange={setInventory} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Type" required>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">Increase</SelectItem>
                <SelectItem value="decrease">Decrease</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Quantity" required>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Reason" required description="Mandatory - explain why this adjustment is needed">
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
