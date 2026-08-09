import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllWarehouses } from '../inventory/warehousesApi';
import { useCreateCustomer, useUpdateCustomer } from './customersApi';
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
} from './customerSchema';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  anniversary: '',
  status: 'lead',
  leadSource: 'walk_in',
  customerType: 'retail',
  gstNumber: '',
  companyName: '',
  preferredStore: '',
  referredByCode: '',
};

export function CustomerFormModal({ open, onOpenChange, customer }) {
  const isEditMode = Boolean(customer);
  const [form, setForm] = useState(EMPTY_FORM);
  const { data: warehousesData } = useAllWarehouses();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const warehouses = warehousesData ?? [];

  useEffect(() => {
    if (customer) {
      setForm({
        firstName: customer.firstName ?? '',
        lastName: customer.lastName ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : '',
        anniversary: customer.anniversary ? customer.anniversary.slice(0, 10) : '',
        status: customer.status ?? 'lead',
        leadSource: customer.leadSource ?? 'walk_in',
        customerType: customer.customerType ?? 'retail',
        gstNumber: customer.gstNumber ?? '',
        companyName: customer.companyName ?? '',
        preferredStore: customer.preferredStore?.id ?? '',
        referredByCode: '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [customer, open]);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      toast.error('Either email or phone is required');
      return;
    }

    const payload = {
      ...form,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      preferredStore: form.preferredStore || undefined,
      referredByCode: form.referredByCode.trim() || undefined,
    };

    try {
      if (isEditMode) {
        await updateCustomer.mutateAsync({ id: customer.id, ...payload });
        toast.success('Customer updated');
      } else {
        await createCustomer.mutateAsync(payload);
        toast.success('Customer created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit customer' : 'New customer'}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : isEditMode ? 'Save changes' : 'Create customer'}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First name" required>
            <Input value={form.firstName} onChange={setField('firstName')} />
          </FormField>
          <FormField label="Last name">
            <Input value={form.lastName} onChange={setField('lastName')} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone" description="Either phone or email is required">
            <Input value={form.phone} onChange={setField('phone')} placeholder="9876543210" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={setField('email')} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date of birth">
            <Input type="date" value={form.dateOfBirth} onChange={setField('dateOfBirth')} />
          </FormField>
          <FormField label="Anniversary">
            <Input type="date" value={form.anniversary} onChange={setField('anniversary')} />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Status">
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Customer type">
            <Select value={form.customerType} onValueChange={(v) => setForm((p) => ({ ...p, customerType: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Lead source">
            <Select value={form.leadSource} onValueChange={(v) => setForm((p) => ({ ...p, leadSource: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {['wholesale', 'b2b'].includes(form.customerType) && (
          <div className="grid grid-cols-2 gap-4 rounded-md border border-border p-3">
            <FormField label="Company name">
              <Input value={form.companyName} onChange={setField('companyName')} />
            </FormField>
            <FormField label="GST number">
              <Input value={form.gstNumber} onChange={setField('gstNumber')} className="uppercase" />
            </FormField>
          </div>
        )}

        <FormField label="Preferred store">
          <Select value={form.preferredStore} onValueChange={(v) => setForm((p) => ({ ...p, preferredStore: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No preference" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {!isEditMode && (
          <FormField label="Referred by code" description="Optional - referral code of the existing customer who referred them">
            <Input value={form.referredByCode} onChange={setField('referredByCode')} className="uppercase" />
          </FormField>
        )}
      </div>
    </Modal>
  );
}
