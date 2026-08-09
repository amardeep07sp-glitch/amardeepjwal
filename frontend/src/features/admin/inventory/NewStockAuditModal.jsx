import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryPickerSelect } from './InventoryPickerSelect';
import { useCreateStockAudit } from './stockAuditsApi';

export function NewStockAuditModal({ open, onOpenChange }) {
  const [inventory, setInventory] = useState('');
  const [countedQuantity, setCountedQuantity] = useState('');
  const createAudit = useCreateStockAudit();

  const reset = () => {
    setInventory('');
    setCountedQuantity('');
  };

  const handleSubmit = async () => {
    if (!inventory || countedQuantity === '') {
      toast.error('Inventory record and counted quantity are required');
      return;
    }
    try {
      await createAudit.mutateAsync({ inventory, countedQuantity: Number(countedQuantity) });
      toast.success('Audit created — review the difference before completing it');
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
      title="New stock audit"
      className="sm:max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createAudit.isPending}>
            {createAudit.isPending ? 'Creating...' : 'Create audit'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Inventory record" required description="System quantity is snapshotted automatically">
          <InventoryPickerSelect value={inventory} onChange={setInventory} />
        </FormField>
        <FormField label="Physically counted quantity" required>
          <Input type="number" min={0} value={countedQuantity} onChange={(e) => setCountedQuantity(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
