import { useState } from 'react';
import { MapPin, Phone, User } from 'lucide-react';
import { useCreateAddress, useUpdateAddress } from '@/features/storefront/storefrontApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

const EMPTY_FORM = { label: '', line1: '', line2: '', city: '', state: '', postalCode: '', phone: '', isDefaultShipping: false };

// Add and edit share one form - edit just seeds it from the existing
// address (address.line1 etc.) instead of EMPTY_FORM.
export function AddressForm({ address, onSuccess, onCancel }) {
  const [form, setForm] = useState(() => (address ? { ...EMPTY_FORM, ...address } : EMPTY_FORM));
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const isPending = createAddress.isPending || updateAddress.isPending;
  const error = createAddress.error || updateAddress.error;

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = address
      ? updateAddress.mutateAsync({ id: address.id, payload: form })
      : createAddress.mutateAsync(form);
    action.then((saved) => onSuccess?.(saved));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 rounded-2xl bg-secondary/40 p-4 ring-1 ring-border sm:p-5">
      <p className="text-sm font-semibold text-heading">{address ? 'Edit Address' : 'Add New Address'}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-11 pl-10" placeholder="Label (e.g. Home, Office)" value={form.label} onChange={set('label')} />
        </div>
        <div className="relative">
          <Phone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-11 pl-10" type="tel" placeholder="Mobile Number" required value={form.phone} onChange={set('phone')} />
        </div>
      </div>

      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 pl-10" placeholder="House No., Building, Street" required value={form.line1} onChange={set('line1')} />
      </div>
      <Input className="h-11" placeholder="Locality / Area (optional)" value={form.line2} onChange={set('line2')} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Input className="h-11" placeholder="City" required value={form.city} onChange={set('city')} />
        <Input className="h-11" placeholder="State" required value={form.state} onChange={set('state')} />
        <Input className="h-11" placeholder="Pincode" required value={form.postalCode} onChange={set('postalCode')} />
      </div>

      <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <Checkbox
          checked={form.isDefaultShipping}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isDefaultShipping: checked }))}
        />
        Set as default delivery address
      </Label>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <div className="mt-1 flex items-center gap-3">
        <Button type="submit" variant="luxury" shape="pill" loading={isPending}>
          Save Address
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
