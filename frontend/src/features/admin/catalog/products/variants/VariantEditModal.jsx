import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateVariant } from './variantsApi';
import { variantSchema, variantFormDefaults, CATALOG_STATUSES, describeAttributes } from './variantSchema';
import { VariantAssignmentEditor } from './VariantAssignmentEditor';

export function VariantEditModal({ open, onOpenChange, productId, variant }) {
  const updateVariant = useUpdateVariant(productId);
  const [assignmentRows, setAssignmentRows] = useState([{ attribute: '', value: '' }]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(variantSchema), defaultValues: variantFormDefaults });

  const needsAssignment = variant && variant.attributes.length === 0;

  useEffect(() => {
    if (open && variant) {
      reset({
        ...variantFormDefaults,
        ...variant,
        priceOverride: variant.priceOverride ?? '',
        weightOverride: variant.weightOverride ?? '',
      });
      setAssignmentRows(
        variant.attributes.length > 0
          ? variant.attributes.map((pair) => ({ attribute: pair.attribute?.id, value: pair.value?.id }))
          : [{ attribute: '', value: '' }]
      );
    }
  }, [open, variant, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      priceOverride: values.priceOverride === '' ? null : Number(values.priceOverride),
      weightOverride: values.weightOverride === '' ? null : Number(values.weightOverride),
    };

    if (needsAssignment) {
      const completeRows = assignmentRows.filter((row) => row.attribute && row.value);
      if (completeRows.length !== assignmentRows.length || completeRows.length === 0) {
        toast.error('Assign a value for every attribute before saving');
        return;
      }
      payload.attributes = completeRows.map((row) => ({ attribute: row.attribute, value: row.value }));
    }

    try {
      await updateVariant.mutateAsync({ variantId: variant.id, payload });
      toast.success('Variant updated successfully');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!variant) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit variant`}
      description={variant.sku}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="variant-edit-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save variant'}
          </Button>
        </>
      }
    >
      <form id="variant-edit-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Attribute combination">
          {needsAssignment ? (
            <VariantAssignmentEditor rows={assignmentRows} onChange={setAssignmentRows} />
          ) : (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {describeAttributes(variant.attributes)}
            </p>
          )}
        </FormField>

        <FormField label="SKU" htmlFor="sku" required error={errors.sku?.message}>
          <Input id="sku" {...register('sku')} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Price override" htmlFor="priceOverride" description="Blank uses the product's price">
            <Input id="priceOverride" type="number" step="0.01" {...register('priceOverride')} />
          </FormField>
          <FormField label="Weight override" htmlFor="weightOverride" description="Blank uses the product's weight">
            <Input id="weightOverride" type="number" step="0.01" {...register('weightOverride')} />
          </FormField>
        </div>

        <FormField label="Order" htmlFor="order" description="Lower numbers appear first">
          <Input id="order" type="number" {...register('order')} />
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
                  {CATALOG_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Visible">
            <Controller
              name="isVisible"
              control={control}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </FormField>
          <FormField label="Featured">
            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </FormField>
          <FormField label="Default variant">
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
