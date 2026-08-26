import { FormField } from '@/components/global/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUPON_ELIGIBILITY_TYPES } from './couponSchema';
import { EntitySearchPicker } from './EntitySearchPicker';
import { useCustomerSearch } from './entitySearchHooks';

// `eligibility` is the form's own shape: { type, selectedCustomers }, where
// selectedCustomers carries {id, label} pairs (same reasoning as
// CouponScopeBuilder's product pickers) - CouponFormModal reduces it to
// plain ids on submit.
export function CouponEligibilityBuilder({ eligibility, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <FormField label="Who can use this coupon" htmlFor="eligibility-type">
        <Select value={eligibility.type} onValueChange={(type) => onChange({ ...eligibility, type })}>
          <SelectTrigger id="eligibility-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUPON_ELIGIBILITY_TYPES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {eligibility.type === 'selected_customers' && (
        <FormField label="Selected customers" description="Only these customers can redeem this coupon">
          <EntitySearchPicker
            selectedEntities={eligibility.selectedCustomers}
            onChange={(entities) => onChange({ ...eligibility, selectedCustomers: entities })}
            useSearchHook={useCustomerSearch}
            getLabel={(c) => c.displayName}
            getSubLabel={(c) => c.phone || c.email}
            searchPlaceholder="Search customers by name, phone or email..."
            emptyLabel="Type to search customers."
            addLabel="Add customer"
          />
        </FormField>
      )}
    </div>
  );
}
