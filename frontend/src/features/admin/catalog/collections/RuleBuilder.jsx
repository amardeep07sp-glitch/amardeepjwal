import { Plus, X } from 'lucide-react';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategoryTree } from '../categories/categoriesApi';
import { flattenTreeForParentOptions } from '../categories/categoryTreeOptions';
import { useBrands } from '../brands/brandsApi';
import { useAllAttributeGroups } from '../attribute-groups/attributeGroupsApi';
import { usePreviewRuleMatches } from './collectionsApi';
import { CATALOG_STATUSES, RULE_FIELD_OPTIONS, STOCK_RULE_VALUE_OPTIONS } from './collectionSchema';

// A fresh condition's shape, keyed by field - matches what
// collection.rules.js#buildRuleFilter expects on the backend.
const DEFAULT_CONDITION_BY_FIELD = {
  category: { field: 'category', operator: 'in', value: [] },
  brand: { field: 'brand', operator: 'in', value: [] },
  price: { field: 'price', operator: 'between', value: { min: undefined, max: undefined } },
  tags: { field: 'tags', operator: 'in', value: [] },
  attributes: { field: 'attributes', operator: 'in', value: [] },
  stock: { field: 'stock', operator: 'equals', value: 'in_stock' },
  featured: { field: 'featured', operator: 'equals', value: true },
  status: { field: 'status', operator: 'in', value: ['published'] },
};

function CheckboxList({ options, value, onChange, emptyLabel }) {
  return (
    <div className="flex max-h-36 flex-col gap-2 overflow-y-auto rounded-lg border border-border p-3">
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

// The condition's value control, shaped per rule field - a category needs a
// multi-select of real categories, a price range needs two number inputs, a
// stock condition needs a single in/out-of-stock choice, etc. Each field's
// operator is fixed (not user-choosable) since every field here only ever
// has one operator that makes sense in this UI.
function ConditionValueEditor({ condition, onChange, categoryOptions, brandOptions, attributeGroupOptions }) {
  switch (condition.field) {
    case 'category':
      return <CheckboxList options={categoryOptions} value={condition.value} onChange={(value) => onChange({ value })} emptyLabel="No categories yet." />;
    case 'brand':
      return <CheckboxList options={brandOptions} value={condition.value} onChange={(value) => onChange({ value })} emptyLabel="No brands yet." />;
    case 'attributes':
      return (
        <CheckboxList options={attributeGroupOptions} value={condition.value} onChange={(value) => onChange({ value })} emptyLabel="No attribute groups yet." />
      );
    case 'status':
      return (
        <CheckboxList
          options={CATALOG_STATUSES}
          value={condition.value}
          onChange={(value) => onChange({ value })}
          emptyLabel="No statuses."
        />
      );
    case 'tags':
      return (
        <Input
          placeholder="gold, bridal, lightweight (comma-separated)"
          defaultValue={(condition.value ?? []).join(', ')}
          onBlur={(e) => onChange({ value: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
        />
      );
    case 'price':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={condition.value?.min ?? ''}
            onBlur={(e) => onChange({ value: { ...condition.value, min: e.target.value === '' ? undefined : Number(e.target.value) } })}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={condition.value?.max ?? ''}
            onBlur={(e) => onChange({ value: { ...condition.value, max: e.target.value === '' ? undefined : Number(e.target.value) } })}
          />
        </div>
      );
    case 'stock':
      return (
        <Select value={condition.value} onValueChange={(value) => onChange({ value })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STOCK_RULE_VALUE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'featured':
      return (
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={Boolean(condition.value)} onCheckedChange={(value) => onChange({ value })} />
          Featured products only
        </label>
      );
    default:
      return null;
  }
}

// The "Rule Builder" tab - only rendered when assignmentType is rule_based.
// Every option here is real data (categories/brands/attribute groups from
// their own admin lists) and the match count is a live, debounce-free query
// keyed by the rules object itself (react-query dedupes rapid identical
// keys naturally as the admin edits).
export function RuleBuilder({ rules, onChange }) {
  const { data: categoryTree = [] } = useCategoryTree();
  const categoryOptions = flattenTreeForParentOptions(categoryTree, undefined).map((c) => ({ value: c.id, label: c.name }));
  const { data: brandsData } = useBrands({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const brandOptions = (brandsData?.items ?? []).map((b) => ({ value: b.id, label: b.name }));
  const { data: attributeGroups = [] } = useAllAttributeGroups();
  const attributeGroupOptions = attributeGroups.map((g) => ({ value: g.id, label: g.name }));

  const { data: preview, isFetching } = usePreviewRuleMatches(rules, { enabled: rules.conditions.length > 0 });

  const updateCondition = (index, patch) => {
    onChange({ ...rules, conditions: rules.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)) });
  };
  const addCondition = () => onChange({ ...rules, conditions: [...rules.conditions, DEFAULT_CONDITION_BY_FIELD.category] });
  const removeCondition = (index) => onChange({ ...rules, conditions: rules.conditions.filter((_, i) => i !== index) });
  const changeField = (index, field) => updateCondition(index, DEFAULT_CONDITION_BY_FIELD[field]);

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Match" description="ALL requires every condition to match; ANY requires just one">
        <Select value={rules.matchMode} onValueChange={(matchMode) => onChange({ ...rules, matchMode })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Match ALL</SelectItem>
            <SelectItem value="any">Match ANY</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {rules.conditions.map((condition, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Select value={condition.field} onValueChange={(field) => changeField(index, field)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_FIELD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove condition" onClick={() => removeCondition(index)}>
              <X className="size-4 text-destructive" />
            </Button>
          </div>
          <ConditionValueEditor
            condition={condition}
            onChange={(patch) => updateCondition(index, patch)}
            categoryOptions={categoryOptions}
            brandOptions={brandOptions}
            attributeGroupOptions={attributeGroupOptions}
          />
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addCondition} className="w-full">
        <Plus className="size-4" />
        Add condition
      </Button>

      <p className="text-sm text-muted-foreground">
        {rules.conditions.length === 0
          ? 'Add at least one condition - an empty rule set matches no products.'
          : isFetching
            ? 'Calculating match count...'
            : `≈ ${preview?.count ?? 0} products match right now`}
      </p>
    </div>
  );
}
