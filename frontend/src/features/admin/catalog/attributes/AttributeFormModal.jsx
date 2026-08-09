import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllAttributeGroups } from '../attribute-groups/attributeGroupsApi';
import { useCreateAttribute, useUpdateAttribute } from './attributesApi';
import { attributeSchema, attributeFormDefaults, ATTRIBUTE_TYPES, ACTIVE_STATUSES } from './attributeSchema';

export function AttributeFormModal({ open, onOpenChange, attribute }) {
  const isEditMode = Boolean(attribute);
  const { data: groups = [] } = useAllAttributeGroups();
  const createAttribute = useCreateAttribute();
  const updateAttribute = useUpdateAttribute();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(attributeSchema), defaultValues: attributeFormDefaults });

  useEffect(() => {
    if (open) {
      reset(
        attribute
          ? { ...attributeFormDefaults, ...attribute, group: attribute.group?.id ?? attribute.group ?? '' }
          : attributeFormDefaults
      );
    }
  }, [open, attribute, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateAttribute.mutateAsync({ id: attribute.id, payload: values });
        toast.success('Attribute updated successfully');
      } else {
        await createAttribute.mutateAsync(values);
        toast.success('Attribute created successfully');
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
      title={isEditMode ? 'Edit attribute' : 'New attribute'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="attribute-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save attribute'}
          </Button>
        </>
      }
    >
      <form id="attribute-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Name" htmlFor="name" required description="e.g. Size, Weight, Purity" error={errors.name?.message}>
          <Input id="name" {...register('name')} />
        </FormField>
        <FormField label="Slug" htmlFor="slug" description="Leave blank to auto-generate">
          <Input id="slug" {...register('slug')} />
        </FormField>
        <FormField label="Attribute group" htmlFor="group" required error={errors.group?.message}>
          <Controller
            name="group"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="group" className="w-full">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Type" htmlFor="type">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTRIBUTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Required">
            <Controller
              name="isRequired"
              control={control}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </FormField>
          <FormField label="Filterable" description="Show in storefront filters">
            <Controller
              name="isFilterable"
              control={control}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </FormField>
        </div>
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
