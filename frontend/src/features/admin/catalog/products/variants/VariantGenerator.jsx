import { useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/global/FormField';
import { useAllAttributes } from '../../attributes/attributesApi';
import { useGenerateVariants } from './variantsApi';
import { AttributeValuePicker } from './AttributeValuePicker';

const emptyRow = () => ({ id: crypto.randomUUID(), attributeId: '', valueIds: [] });

export function VariantGenerator({ productId }) {
  const { data: attributes = [] } = useAllAttributes();
  const generateVariants = useGenerateVariants(productId);

  const [rows, setRows] = useState([emptyRow()]);
  const [skuPrefix, setSkuPrefix] = useState('');

  const usedAttributeIds = rows.map((r) => r.attributeId).filter(Boolean);
  const combinationCount = rows.reduce((total, row) => (row.valueIds.length ? total * row.valueIds.length : 0), 1);
  const canGenerate = rows.length > 0 && rows.every((r) => r.attributeId && r.valueIds.length > 0);

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id) => setRows((prev) => prev.filter((row) => row.id !== id));
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const handleGenerate = async () => {
    try {
      const result = await generateVariants.mutateAsync({
        attributes: rows.map((row) => ({ attributeId: row.attributeId, valueIds: row.valueIds })),
        skuPrefix: skuPrefix || undefined,
      });
      const createdCount = result.created.length;
      const message =
        result.skippedCount > 0
          ? `Created ${createdCount} variants (${result.skippedCount} combinations already existed)`
          : `Created ${createdCount} variants`;
      toast.success(message);
      setRows([emptyRow()]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="size-4" />
          Variant generator
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Pick attributes and the values that apply, and every combination will be generated automatically.
        </p>

        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Select value={row.attributeId} onValueChange={(value) => updateRow(row.id, { attributeId: value, valueIds: [] })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an attribute" />
                </SelectTrigger>
                <SelectContent>
                  {attributes
                    .filter((a) => a.id === row.attributeId || !usedAttributeIds.includes(a.id))
                    .map((attribute) => (
                      <SelectItem key={attribute.id} value={attribute.id}>
                        {attribute.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove attribute row"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>

            {row.attributeId && (
              <AttributeValuePicker
                attributeId={row.attributeId}
                selectedValueIds={row.valueIds}
                onChange={(valueIds) => updateRow(row.id, { valueIds })}
              />
            )}
          </div>
        ))}

        <Button variant="outline" size="sm" className="self-start" onClick={addRow}>
          <Plus />
          Add attribute
        </Button>

        <FormField label="SKU prefix" description="Defaults to the product's SKU">
          <Input value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} placeholder="e.g. RING-001" />
        </FormField>

        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {combinationCount > 0
              ? `This will generate up to ${combinationCount} variant${combinationCount === 1 ? '' : 's'}`
              : 'Select at least one value per attribute to preview combinations'}
          </span>
          <Button size="sm" disabled={!canGenerate || generateVariants.isPending} onClick={handleGenerate}>
            {generateVariants.isPending ? 'Generating...' : 'Generate variants'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
