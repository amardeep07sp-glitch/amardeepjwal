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
import { MediaPicker } from '../../media/MediaPicker';
import { toMediaIdForSubmit } from '../../media/mediaSchema';
import { useCreatePage, useUpdatePage } from './pagesApi';
import { pageSchema, pageFormDefaults } from './pageSchema';

export function PageFormModal({ open, onOpenChange, page }) {
  const isEditMode = Boolean(page);
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(pageSchema), defaultValues: pageFormDefaults });

  useEffect(() => {
    if (open) {
      reset(page ? { ...pageFormDefaults, ...page } : pageFormDefaults);
    }
  }, [open, page, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      heroMedia: toMediaIdForSubmit(values.heroMedia),
      ogImageMedia: toMediaIdForSubmit(values.ogImageMedia),
    };
    try {
      if (isEditMode) {
        await updatePage.mutateAsync({ id: page.id, payload });
        toast.success('Page updated successfully');
      } else {
        await createPage.mutateAsync(payload);
        toast.success('Page created successfully');
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
      title={isEditMode ? 'Edit page' : 'New page'}
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="page-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save page'}
          </Button>
        </>
      }
    >
      <form id="page-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
          <Input id="title" {...register('title')} />
        </FormField>

        <FormField
          label="Slug"
          htmlFor="slug"
          description="Leave blank to auto-generate from the title"
          error={errors.slug?.message}
        >
          <Input id="slug" placeholder="e.g. about-us" {...register('slug')} />
        </FormField>

        <FormField label="Content" htmlFor="content" error={errors.content?.message}>
          <Textarea id="content" rows={6} {...register('content')} />
        </FormField>

        <FormField label="Hero image" description="Optional">
          <Controller
            name="heroMedia"
            control={control}
            render={({ field }) => (
              <MediaPicker value={field.value} onChange={field.onChange} entityType="page" entityId={page?.id} />
            )}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status?.message}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField label="Meta title" htmlFor="metaTitle" description="SEO">
          <Input id="metaTitle" {...register('metaTitle')} />
        </FormField>

        <FormField label="Meta description" htmlFor="metaDescription" description="SEO">
          <Textarea id="metaDescription" rows={2} {...register('metaDescription')} />
        </FormField>

        <FormField label="OG image" description="SEO">
          <Controller
            name="ogImageMedia"
            control={control}
            render={({ field }) => (
              <MediaPicker value={field.value} onChange={field.onChange} entityType="page" entityId={page?.id} />
            )}
          />
        </FormField>
      </form>
    </Modal>
  );
}
