import { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useAddressesForCustomer, useCreateAddress, useUpdateAddress, useDeleteAddress } from './addressesApi';
import { ADDRESS_TYPE_LABELS } from './customerSchema';

const EMPTY_FORM = { type: 'shipping', label: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', phone: '' };

export function AddressBookTab({ customerId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: addresses } = useAddressesForCustomer(customerId);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!form.line1.trim() || !form.city.trim() || !form.state.trim() || !form.postalCode.trim()) {
      toast.error('Line 1, city, state, and postal code are required');
      return;
    }
    try {
      await createAddress.mutateAsync({ customer: customerId, ...form });
      toast.success('Address added');
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSetDefault = async (address, field) => {
    try {
      await updateAddress.mutateAsync({ id: address.id, [field]: true });
      toast.success('Default address updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast.success('Address deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus /> Add address
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <EmptyState title="No addresses yet" description="Add a billing, shipping, office, or warehouse address." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">{ADDRESS_TYPE_LABELS[a.type] ?? a.type}</Badge>
                <div className="flex items-center gap-1">
                  {a.isDefaultBilling && <Badge variant="info">Default billing</Badge>}
                  {a.isDefaultShipping && <Badge variant="success">Default shipping</Badge>}
                </div>
              </div>
              <p>{a.label && <span className="font-medium">{a.label}: </span>}{a.line1}, {a.line2}</p>
              <p className="text-muted-foreground">{a.city}, {a.state} {a.postalCode}, {a.country}</p>
              {a.phone && <p className="text-muted-foreground">{a.phone}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {!a.isDefaultBilling && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(a, 'isDefaultBilling')}>
                    <Star className="size-3.5" /> Set default billing
                  </Button>
                )}
                {!a.isDefaultShipping && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(a, 'isDefaultShipping')}>
                    <Star className="size-3.5" /> Set default shipping
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" aria-label="Delete address" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add address"
        className="sm:max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createAddress.isPending}>
              {createAddress.isPending ? 'Adding...' : 'Add address'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Type">
            <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ADDRESS_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
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
    </div>
  );
}
