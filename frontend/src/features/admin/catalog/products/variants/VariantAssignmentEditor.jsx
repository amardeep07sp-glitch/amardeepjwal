import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllAttributes } from '../../attributes/attributesApi';
import { useAttributeValuesByAttribute } from '../../attribute-values/attributeValuesApi';

function AssignmentRow({ row, usedAttributeIds, attributes, onChange, onRemove, canRemove }) {
  const { data: values = [] } = useAttributeValuesByAttribute(row.attribute);

  return (
    <div className="flex items-center gap-2">
      <Select value={row.attribute} onValueChange={(value) => onChange({ ...row, attribute: value, value: '' })}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Attribute" />
        </SelectTrigger>
        <SelectContent>
          {attributes
            .filter((a) => a.id === row.attribute || !usedAttributeIds.includes(a.id))
            .map((attribute) => (
              <SelectItem key={attribute.id} value={attribute.id}>
                {attribute.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Select value={row.value} onValueChange={(value) => onChange({ ...row, value })} disabled={!row.attribute}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Value" />
        </SelectTrigger>
        <SelectContent>
          {values.map((value) => (
            <SelectItem key={value.id} value={value.id}>
              {value.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon-sm" aria-label="Remove attribute" onClick={onRemove} disabled={!canRemove}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

export function VariantAssignmentEditor({ rows, onChange }) {
  const { data: attributes = [] } = useAllAttributes();
  const usedAttributeIds = rows.map((r) => r.attribute).filter(Boolean);

  const updateRow = (index, nextRow) => {
    onChange(rows.map((row, i) => (i === index ? nextRow : row)));
  };
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, { attribute: '', value: '' }]);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <AssignmentRow
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          row={row}
          usedAttributeIds={usedAttributeIds}
          attributes={attributes}
          onChange={(next) => updateRow(index, next)}
          onRemove={() => removeRow(index)}
          canRemove={rows.length > 1}
        />
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addRow}>
        <Plus />
        Add attribute
      </Button>
    </div>
  );
}
