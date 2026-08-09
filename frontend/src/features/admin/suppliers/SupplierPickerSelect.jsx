import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSuppliers } from './suppliersApi';

// Reused by the Purchase Order builder - search/select an existing
// supplier. Unlike CustomerPickerSelect there is no quick-create here:
// GST/PAN/bank details make a supplier profile worth filling in properly on
// the dedicated Supplier form rather than a walk-in-style inline shortcut.
export function SupplierPickerSelect({ value, onChange }) {
  const { data } = useSuppliers({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const suppliers = data?.items ?? [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a supplier" />
      </SelectTrigger>
      <SelectContent>
        {suppliers.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name} {s.supplierCode ? `(${s.supplierCode})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
