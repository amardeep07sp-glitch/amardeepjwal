import { Checkbox } from '@/components/ui/checkbox';

// Same bounded-size multi-select list RuleBuilder.jsx uses for its own
// category/brand/attribute conditions - appropriate here too since
// categories/brands/collections/metals/purities/gemstones are all small,
// fully-known option sets (unlike Products/Customers, which need
// EntitySearchPicker's search-then-add instead).
export function CheckboxMultiSelect({ options, value, onChange, emptyLabel }) {
  return (
    <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border border-border p-3">
      {options.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
      {options.map((option) => {
        const checked = value.includes(option.value);
        return (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={checked}
              onCheckedChange={(isChecked) => onChange(isChecked ? [...value, option.value] : value.filter((v) => v !== option.value))}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
