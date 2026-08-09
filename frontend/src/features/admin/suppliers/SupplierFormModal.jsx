import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateSupplier, useUpdateSupplier } from './suppliersApi';
import { SUPPLIER_STATUS_LABELS } from './supplierSchema';

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  gstNumber: '',
  panNumber: '',
  status: 'active',
  bankDetails: { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branch: '' },
};

export function SupplierFormModal({ open, onOpenChange, supplier }) {
  const isEditMode = Boolean(supplier);
  const [form, setForm] = useState(EMPTY_FORM);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name ?? '',
        contactPerson: supplier.contactPerson ?? '',
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        gstNumber: supplier.gstNumber ?? '',
        panNumber: supplier.panNumber ?? '',
        status: supplier.status ?? 'active',
        bankDetails: {
          accountHolderName: supplier.bankDetails?.accountHolderName ?? '',
          accountNumber: supplier.bankDetails?.accountNumber ?? '',
          ifscCode: supplier.bankDetails?.ifscCode ?? '',
          bankName: supplier.bankDetails?.bankName ?? '',
          branch: supplier.bankDetails?.branch ?? '',
        },
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [supplier, open]);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setBankField = (field) => (e) => setForm((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, [field]: e.target.value } }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    const payload = { ...form, email: form.email.trim() || undefined, phone: form.phone.trim() || undefined };

    try {
      if (isEditMode) {
        await updateSupplier.mutateAsync({ id: supplier.id, ...payload });
        toast.success('Supplier updated');
      } else {
        await createSupplier.mutateAsync(payload);
        toast.success('Supplier created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isPending = createSupplier.isPending || updateSupplier.isPending;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit supplier' : 'New supplier'}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : isEditMode ? 'Save changes' : 'Create supplier'}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Supplier name" required>
            <Input value={form.name} onChange={setField('name')} />
          </FormField>
          <FormField label="Contact person">
            <Input value={form.contactPerson} onChange={setField('contactPerson')} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone">
            <Input value={form.phone} onChange={setField('phone')} placeholder="9876543210" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={setField('email')} />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="GST number">
            <Input value={form.gstNumber} onChange={setField('gstNumber')} className="uppercase" />
          </FormField>
          <FormField label="PAN number">
            <Input value={form.panNumber} onChange={setField('panNumber')} className="uppercase" />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPLIER_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="mb-3 text-sm font-medium text-heading">Bank details</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Account holder name">
              <Input value={form.bankDetails.accountHolderName} onChange={setBankField('accountHolderName')} />
            </FormField>
            <FormField label="Account number">
              <Input value={form.bankDetails.accountNumber} onChange={setBankField('accountNumber')} />
            </FormField>
            <FormField label="IFSC code">
              <Input value={form.bankDetails.ifscCode} onChange={setBankField('ifscCode')} className="uppercase" />
            </FormField>
            <FormField label="Bank name">
              <Input value={form.bankDetails.bankName} onChange={setBankField('bankName')} />
            </FormField>
            <FormField label="Branch">
              <Input value={form.bankDetails.branch} onChange={setBankField('branch')} />
            </FormField>
          </div>
        </div>
      </div>
    </Modal>
  );
}
