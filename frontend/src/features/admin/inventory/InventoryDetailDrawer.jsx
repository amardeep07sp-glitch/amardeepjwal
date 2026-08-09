import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Drawer } from '@/components/global/Drawer';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInventoryById, useUpdateInventorySettings } from './inventoryApi';
import { inventorySettingsSchema, inventorySettingsDefaults, STOCK_STATUS_BADGE_VARIANTS } from './inventorySchema';
import { LedgerTimeline } from './LedgerTimeline';

export function InventoryDetailDrawer({ inventoryId, open, onOpenChange }) {
  const { data: inventory } = useInventoryById(open ? inventoryId : undefined);
  const updateSettings = useUpdateInventorySettings();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm({ resolver: zodResolver(inventorySettingsSchema), defaultValues: inventorySettingsDefaults });

  useEffect(() => {
    if (inventory) {
      reset({
        minimumStock: inventory.minimumStock,
        maximumStock: inventory.maximumStock,
        reorderLevel: inventory.reorderLevel,
        active: inventory.active,
      });
    }
  }, [inventory, reset]);

  const onSubmit = async (values) => {
    try {
      await updateSettings.mutateAsync({ id: inventoryId, payload: values });
      toast.success('Inventory settings updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={inventory?.product?.name ?? 'Inventory record'}
      description={inventory?.sku}
    >
      {inventory && (
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STOCK_STATUS_BADGE_VARIANTS[inventory.stockStatus]} className="capitalize">
              {inventory.stockStatus.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">{inventory.warehouse?.name}</Badge>
            {!inventory.active && <Badge variant="secondary">Inactive</Badge>}
          </div>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Available</dt>
              <dd className="text-lg font-semibold text-heading">{inventory.availableQuantity}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reserved</dt>
              <dd className="text-lg font-semibold text-heading">{inventory.reservedQuantity}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Damaged</dt>
              <dd>{inventory.damagedQuantity}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Returned</dt>
              <dd>{inventory.returnedQuantity}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Incoming</dt>
              <dd>{inventory.incomingQuantity}</dd>
            </div>
          </dl>

          <Separator />

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-sm font-medium text-heading">Stock thresholds</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="Minimum" htmlFor="minimumStock">
                <Input id="minimumStock" type="number" min={0} {...register('minimumStock')} />
              </FormField>
              <FormField label="Maximum" htmlFor="maximumStock">
                <Input id="maximumStock" type="number" min={0} {...register('maximumStock')} />
              </FormField>
              <FormField label="Reorder at" htmlFor="reorderLevel">
                <Input id="reorderLevel" type="number" min={0} {...register('reorderLevel')} />
              </FormField>
            </div>
            <FormField label="Active">
              <Controller
                name="active"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </FormField>
            <Button type="submit" size="sm" className="self-start" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save thresholds'}
            </Button>
          </form>

          <Separator />

          <div>
            <p className="mb-3 text-sm font-medium text-heading">Movement history</p>
            <LedgerTimeline inventoryId={inventoryId} />
          </div>
        </div>
      )}
    </Drawer>
  );
}
