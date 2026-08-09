import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateWarehouse, useUpdateWarehouse } from './warehousesApi';
import { warehouseSchema, warehouseFormDefaults, WAREHOUSE_STATUSES } from './warehouseSchema';

export function WarehouseFormModal({ open, onOpenChange, warehouse }) {
  const isEditMode = Boolean(warehouse);
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(warehouseSchema), defaultValues: warehouseFormDefaults });

  useEffect(() => {
    if (open) {
      reset(warehouse ? { ...warehouseFormDefaults, ...warehouse } : warehouseFormDefaults);
    }
  }, [open, warehouse, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateWarehouse.mutateAsync({ id: warehouse.id, payload: values });
        toast.success('Warehouse updated successfully');
      } else {
        await createWarehouse.mutateAsync(values);
        toast.success('Warehouse created successfully');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit warehouse' : 'New warehouse'}
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="warehouse-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save warehouse'}
          </Button>
        </>
      }
    >
      <form
        id="warehouse-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" {...register('name')} />
          </FormField>
          <FormField label="Code" htmlFor="code" required description="Short unique code" error={errors.code?.message}>
            <Input id="code" placeholder="e.g. MAIN" {...register('code')} />
          </FormField>
        </div>
        <FormField label="Address" htmlFor="address">
          <Textarea id="address" rows={2} {...register('address')} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Contact person" htmlFor="contactPerson">
            <Input id="contactPerson" {...register('contactPerson')} />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" {...register('phone')} />
          </FormField>
        </div>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} />
        </FormField>

        <Separator />
        <FormField label="Status" htmlFor="status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAREHOUSE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Set as default warehouse" description="New inventory records are provisioned here">
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </FormField>
      </form>
    </Modal>
  );
}
