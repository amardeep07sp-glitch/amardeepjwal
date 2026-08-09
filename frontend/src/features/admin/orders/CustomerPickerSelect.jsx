import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { useCustomers, useQuickCreateCustomer } from '../customers/customersApi';

// Shared by the order builder - search/select an existing (CRM) customer,
// or quick-create a walk-in one inline (Admin/POS entry, no login intent
// yet - see backend customer.service.js#createCustomer). The single "Name"
// input here maps to the CRM's `firstName` field; a full first/last-name
// split is only worth asking for in the dedicated Customer form.
export function CustomerPickerSelect({ value, onChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const { data } = useCustomers({ limit: 100 });
  const quickCreate = useQuickCreateCustomer();
  const customers = data?.items ?? [];

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      toast.error('Either email or phone is required');
      return;
    }
    try {
      const { data: customer } = await quickCreate.mutateAsync({ firstName: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined });
      toast.success('Customer added');
      onChange(customer.id);
      setModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : c.email ? `(${c.email})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" aria-label="New customer" onClick={() => setModalOpen(true)}>
          <UserPlus className="size-4" />
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Quick-add customer"
        className="sm:max-w-sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreate} disabled={quickCreate.isPending}>
              {quickCreate.isPending ? 'Adding...' : 'Add customer'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
          </FormField>
          <FormField label="Phone" description="Either phone or email is required">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com" />
          </FormField>
        </div>
      </Modal>
    </>
  );
}
