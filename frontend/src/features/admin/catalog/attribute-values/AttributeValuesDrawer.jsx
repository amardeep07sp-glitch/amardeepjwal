import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Drawer } from '@/components/global/Drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { EmptyState } from '@/components/global/EmptyState';
import { PageLoader } from '@/components/global/Loading';
import { useAttributeValuesByAttribute, useDeleteAttributeValue } from './attributeValuesApi';
import { AttributeValueFormModal } from './AttributeValueFormModal';

export function AttributeValuesDrawer({ open, onOpenChange, attribute }) {
  const { data: values = [], isLoading } = useAttributeValuesByAttribute(attribute?.id);
  const deleteValue = useDeleteAttributeValue();

  const [formModalState, setFormModalState] = useState({ open: false, value: null });
  const [valueToDelete, setValueToDelete] = useState(null);

  if (!attribute) return null;

  const handleDeleteConfirm = async () => {
    try {
      await deleteValue.mutateAsync(valueToDelete.id);
      toast.success('Value deleted successfully');
      setValueToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={`Values - ${attribute.name}`}
      description={`Manage the selectable options for this ${attribute.type} attribute`}
      footer={
        <Button className="w-full" onClick={() => setFormModalState({ open: true, value: null })}>
          <Plus />
          Add value
        </Button>
      }
    >
      <div className="flex flex-col gap-2 py-4">
        {isLoading && <PageLoader label="Loading values..." />}

        {!isLoading && values.length === 0 && (
          <EmptyState title="No values yet" description="Add the first selectable option for this attribute." />
        )}

        {!isLoading &&
          values.map((value) => (
            <div
              key={value.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {value.hexColor && (
                  <span
                    className="size-4 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: value.hexColor }}
                  />
                )}
                <span className="text-sm text-foreground">{value.value}</span>
                <Badge variant={value.status === 'active' ? 'success' : 'secondary'}>{value.status}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${value.value}`}
                  onClick={() => setFormModalState({ open: true, value })}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${value.value}`}
                  onClick={() => setValueToDelete(value)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
      </div>

      <AttributeValueFormModal
        open={formModalState.open}
        onOpenChange={(o) => setFormModalState({ open: o, value: o ? formModalState.value : null })}
        attribute={attribute}
        value={formModalState.value}
      />

      <ConfirmDialog
        open={Boolean(valueToDelete)}
        onOpenChange={(o) => !o && setValueToDelete(null)}
        title="Delete this value?"
        description={`"${valueToDelete?.value}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteValue.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </Drawer>
  );
}
