import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { useAddressesForCustomer, useCreateAddress } from '../customers/addressesApi';

export function AddressPickerSelect({ customerId, value, onChange, label = 'Address' }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ label: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', phone: '' });

  const { data } = useAddressesForCustomer(customerId);
  const createAddress = useCreateAddress();
  const addresses = data ?? [];

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!form.line1.trim() || !form.city.trim() || !form.state.trim() || !form.postalCode.trim()) {
      toast.error('Line 1, city, state, and postal code are required');
      return;
    }
    try {
      const { data: address } = await createAddress.mutateAsync({ customer: customerId, ...form });
      toast.success('Address added');
      onChange(address.id);
      setModalOpen(false);
      setForm({ label: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', phone: '' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange} disabled={!customerId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={customerId ? `Select ${label.toLowerCase()}` : 'Select a customer first'} />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label ? `${a.label} - ` : ''}
                {a.line1}, {a.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" aria-label={`New ${label}`} disabled={!customerId} onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={`Add ${label.toLowerCase()}`}
        className="sm:max-w-md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreate} disabled={createAddress.isPending}>
              {createAddress.isPending ? 'Adding...' : 'Add address'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Label" description="e.g. Home, Office">
            <Input value={form.label} onChange={setField('label')} />
          </FormField>
          <FormField label="Address line 1" required>
            <Input value={form.line1} onChange={setField('line1')} />
          </FormField>
          <FormField label="Address line 2">
            <Input value={form.line2} onChange={setField('line2')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="City" required>
              <Input value={form.city} onChange={setField('city')} />
            </FormField>
            <FormField label="State" required>
              <Input value={form.state} onChange={setField('state')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Postal code" required>
              <Input value={form.postalCode} onChange={setField('postalCode')} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={setField('phone')} />
            </FormField>
          </div>
        </div>
      </Modal>
    </>
  );
}
