import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryPickerSelect } from './InventoryPickerSelect';
import { useAllWarehouses } from './warehousesApi';
import { useRequestStockTransfer } from './stockTransfersApi';

export function NewTransferModal({ open, onOpenChange }) {
  const [inventory, setInventory] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [quantity, setQuantity] = useState('');
  const { data: warehousesData } = useAllWarehouses();
  const requestTransfer = useRequestStockTransfer();

  const warehouses = warehousesData ?? [];

  const reset = () => {
    setInventory('');
    setFromWarehouse('');
    setToWarehouse('');
    setQuantity('');
  };

  const handleSubmit = async () => {
    if (!inventory || !fromWarehouse || !toWarehouse || !quantity) {
      toast.error('All fields are required');
      return;
    }
    try {
      await requestTransfer.mutateAsync({ inventory, fromWarehouse, toWarehouse, quantity: Number(quantity) });
      toast.success('Transfer requested');
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
      title="Request stock transfer"
      className="sm:max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={requestTransfer.isPending}>
            {requestTransfer.isPending ? 'Requesting...' : 'Request transfer'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Inventory record" required description="Its current warehouse becomes the source">
          <InventoryPickerSelect value={inventory} onChange={setInventory} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="From warehouse" required>
            <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="To warehouse" required>
            <Select value={toWarehouse} onValueChange={setToWarehouse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <FormField label="Quantity" required>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
