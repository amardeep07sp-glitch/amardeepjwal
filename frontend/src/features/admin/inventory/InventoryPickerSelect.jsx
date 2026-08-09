import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventoryList } from './inventoryApi';

// Shared by Stock Adjustment / Transfer / Audit "new" modals - all three
// need to pick an existing Inventory record, so this is built once rather
// than duplicated three times.
export function InventoryPickerSelect({ value, onChange, placeholder = 'Select an inventory record' }) {
  const { data } = useInventoryList({ limit: 100, sortBy: 'sku', sortOrder: 'asc' });
  const items = data?.items ?? [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.sku} — {item.product?.name ?? 'Unknown'} ({item.warehouse?.name}) · {item.availableQuantity} avail.
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
