import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useCreateFooterColumn, useUpdateFooterColumn } from './footerColumnsApi';
import { footerColumnSchema, footerColumnFormDefaults } from './footerColumnSchema';

export function FooterColumnFormModal({ open, onOpenChange, column }) {
  const isEditMode = Boolean(column);
  const createFooterColumn = useCreateFooterColumn();
  const updateFooterColumn = useUpdateFooterColumn();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(footerColumnSchema), defaultValues: footerColumnFormDefaults });

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: 'links',
  });

  useEffect(() => {
    if (open) {
      reset(column ? { ...footerColumnFormDefaults, ...column } : footerColumnFormDefaults);
    }
  }, [open, column, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateFooterColumn.mutateAsync({ id: column._id, payload: values });
        toast.success('Footer column updated successfully');
      } else {
        await createFooterColumn.mutateAsync(values);
        toast.success('Footer column created successfully');
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
      title={isEditMode ? 'Edit footer column' : 'New footer column'}
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="footer-column-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save column'}
          </Button>
        </>
      }
    >
      <form id="footer-column-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Column title" htmlFor="title" required error={errors.title?.message}>
          <Input id="title" placeholder="e.g. Quick Links" {...register('title')} />
        </FormField>

        <FormField label="Order" htmlFor="order" description="Lower numbers appear first">
          <Input id="order" type="number" {...register('order')} />
        </FormField>

        <FormField label="Active">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </FormField>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-heading">Links</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendLink({ label: '', url: '' })}
            >
              <Plus />
              Add link
            </Button>
          </div>

          {linkFields.length === 0 && (
            <p className="text-sm text-muted-foreground">No links added yet.</p>
          )}

          {linkFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2 rounded-lg border border-border p-3">
              <div className="flex flex-1 flex-col gap-2">
                <FormField
                  label="Label"
                  htmlFor={`links.${index}.label`}
                  error={errors.links?.[index]?.label?.message}
                >
                  <Input id={`links.${index}.label`} {...register(`links.${index}.label`)} />
                </FormField>
                <FormField
                  label="URL"
                  htmlFor={`links.${index}.url`}
                  error={errors.links?.[index]?.url?.message}
                >
                  <Input id={`links.${index}.url`} {...register(`links.${index}.url`)} />
                </FormField>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove link"
                onClick={() => removeLink(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
}
