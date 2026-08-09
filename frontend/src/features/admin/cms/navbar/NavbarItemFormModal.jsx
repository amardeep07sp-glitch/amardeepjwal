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
import { usePages } from '../pages/pagesApi';
import { useCreateNavbarItem, useUpdateNavbarItem } from './navbarApi';
import { navbarItemSchema, navbarItemFormDefaults } from './navbarItemSchema';

export function NavbarItemFormModal({ open, onOpenChange, item }) {
  const isEditMode = Boolean(item);
  const { data: pages = [] } = usePages();
  const createNavbarItem = useCreateNavbarItem();
  const updateNavbarItem = useUpdateNavbarItem();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(navbarItemSchema), defaultValues: navbarItemFormDefaults });

  const linkType = watch('type');

  useEffect(() => {
    if (open) {
      reset(
        item
          ? { ...navbarItemFormDefaults, ...item, page: item.page?._id ?? item.page ?? '' }
          : navbarItemFormDefaults
      );
    }
  }, [open, item, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateNavbarItem.mutateAsync({ id: item._id, payload: values });
        toast.success('Navbar item updated successfully');
      } else {
        await createNavbarItem.mutateAsync(values);
        toast.success('Navbar item created successfully');
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
      title={isEditMode ? 'Edit navbar item' : 'New navbar item'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="navbar-item-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="navbar-item-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Label" htmlFor="label" required error={errors.label?.message}>
          <Input id="label" {...register('label')} />
        </FormField>

        <FormField label="Link type" htmlFor="type">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom_link">Custom URL</SelectItem>
                  <SelectItem value="static_page">Static page</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        {linkType === 'custom_link' ? (
          <FormField label="URL" htmlFor="url" required error={errors.url?.message}>
            <Input id="url" placeholder="https://... or /path" {...register('url')} />
          </FormField>
        ) : (
          <FormField label="Page" htmlFor="page" required error={errors.page?.message}>
            <Controller
              name="page"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="page" className="w-full">
                    <SelectValue placeholder="Select a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page._id} value={page._id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )}

        <FormField label="Order" htmlFor="order" description="Lower numbers appear first">
          <Input id="order" type="number" {...register('order')} />
        </FormField>

        <FormField label="Open in new tab">
          <Controller
            name="openInNewTab"
            control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </FormField>

        <FormField label="Active">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </FormField>
      </form>
    </Modal>
  );
}
