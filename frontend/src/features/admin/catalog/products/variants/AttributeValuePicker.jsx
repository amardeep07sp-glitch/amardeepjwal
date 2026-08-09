import { Checkbox } from '@/components/ui/checkbox';
import { useAttributeValuesByAttribute } from '../../attribute-values/attributeValuesApi';

export function AttributeValuePicker({ attributeId, selectedValueIds, onChange }) {
  const { data: values = [] } = useAttributeValuesByAttribute(attributeId);

  if (values.length === 0) {
    return <p className="text-sm text-muted-foreground">This attribute has no values yet.</p>;
  }

  const toggle = (valueId) => {
    onChange(
      selectedValueIds.includes(valueId)
        ? selectedValueIds.filter((id) => id !== valueId)
        : [...selectedValueIds, valueId]
    );
  };

  return (
    <div className="flex flex-wrap gap-3">
      {values.map((value) => (
        <label key={value.id} className="flex items-center gap-1.5 text-sm">
          <Checkbox checked={selectedValueIds.includes(value.id)} onCheckedChange={() => toggle(value.id)} />
          {value.value}
        </label>
      ))}
    </div>
  );
}
