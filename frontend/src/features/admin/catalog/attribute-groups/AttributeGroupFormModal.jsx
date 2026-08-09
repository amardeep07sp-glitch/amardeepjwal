import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAttributeGroup, useUpdateAttributeGroup } from './attributeGroupsApi';
import { attributeGroupSchema, attributeGroupFormDefaults, ACTIVE_STATUSES } from './attributeGroupSchema';

export function AttributeGroupFormModal({ open, onOpenChange, group }) {
  const isEditMode = Boolean(group);
  const createGroup = useCreateAttributeGroup();
  const updateGroup = useUpdateAttributeGroup();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(attributeGroupSchema), defaultValues: attributeGroupFormDefaults });

  useEffect(() => {
    if (open) {
      reset(group ? { ...attributeGroupFormDefaults, ...group } : attributeGroupFormDefaults);
    }
  }, [open, group, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateGroup.mutateAsync({ id: group.id, payload: values });
        toast.success('Attribute group updated successfully');
      } else {
        await createGroup.mutateAsync(values);
        toast.success('Attribute group created successfully');
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
      title={isEditMode ? 'Edit attribute group' : 'New attribute group'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="attribute-group-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save group'}
          </Button>
        </>
      }
    >
      <form id="attribute-group-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" required description="e.g. Metal, Purity, Weight, Stone" error={errors.name?.message}>
          <Input id="name" {...register('name')} />
        </FormField>
        <FormField label="Slug" htmlFor="slug" description="Leave blank to auto-generate">
          <Input id="slug" {...register('slug')} />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={2} {...register('description')} />
        </FormField>
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
                  {ACTIVE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </form>
    </Modal>
  );
}
