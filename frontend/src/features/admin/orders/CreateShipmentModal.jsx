import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateShipment } from './orderShipmentsApi';

// `items` should already be filtered to shippable (packed, not yet
// shipped/delivered/cancelled) OrderItems by the caller.
export function CreateShipmentModal({ orderId, items, open, onOpenChange }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const createShipment = useCreateShipment();

  const toggleItem = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleSubmit = async () => {
    try {
      await createShipment.mutateAsync({
        orderId,
        itemIds: selectedIds.length ? selectedIds : undefined,
        courier,
        trackingNumber,
        trackingUrl,
      });
      toast.success('Shipment created');
      onOpenChange(false);
      setSelectedIds([]);
      setCourier('');
      setTrackingNumber('');
      setTrackingUrl('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create shipment"
      className="sm:max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createShipment.isPending}>
            {createShipment.isPending ? 'Creating...' : 'Create shipment'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Items" description="Leave all unchecked to ship every remaining item">
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            {items.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleItem(item.id)} />
                {item.productSnapshot?.name ?? item.sku} x{item.quantity}
              </label>
            ))}
          </div>
        </FormField>
        <FormField label="Courier">
          <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Delhivery" />
        </FormField>
        <FormField label="Tracking number">
          <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
        </FormField>
        <FormField label="Tracking URL">
          <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}
