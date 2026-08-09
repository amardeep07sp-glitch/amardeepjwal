import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAttributeValue, useUpdateAttributeValue } from './attributeValuesApi';
import { attributeValueSchema, attributeValueFormDefaults } from './attributeValueSchema';

export function AttributeValueFormModal({ open, onOpenChange, attribute, value }) {
  const isEditMode = Boolean(value);
  const createValue = useCreateAttributeValue();
  const updateValue = useUpdateAttributeValue();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(attributeValueSchema), defaultValues: attributeValueFormDefaults });

  useEffect(() => {
    if (open) {
      reset(
        value
          ? { ...attributeValueFormDefaults, ...value, attribute: attribute.id }
          : { ...attributeValueFormDefaults, attribute: attribute.id }
      );
    }
  }, [open, value, attribute, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateValue.mutateAsync({ id: value.id, payload: values });
        toast.success('Value updated successfully');
      } else {
        await createValue.mutateAsync(values);
        toast.success('Value added successfully');
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
      title={isEditMode ? 'Edit value' : `New value for ${attribute.name}`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="attribute-value-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save value'}
          </Button>
        </>
      }
    >
      <form id="attribute-value-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Value" htmlFor="value" required error={errors.value?.message}>
          <Input id="value" placeholder="e.g. Gold, 22K, Round" {...register('value')} />
        </FormField>

        {attribute.type === 'color' && (
          <FormField label="Hex color" htmlFor="hexColor" description="e.g. #FFD700">
            <Input id="hexColor" {...register('hexColor')} />
          </FormField>
        )}

        {attribute.type === 'image' && (
          <FormField label="Image URL" htmlFor="imageUrl">
            <Input id="imageUrl" {...register('imageUrl')} />
          </FormField>
        )}

        <FormField label="Order" htmlFor="order" description="Lower numbers appear first">
          <Input id="order" type="number" {...register('order')} />
        </FormField>

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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </form>
    </Modal>
  );
}
