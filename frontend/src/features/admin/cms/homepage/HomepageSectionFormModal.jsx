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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaPicker } from '../../media/MediaPicker';
import { toMediaIdForSubmit } from '../../media/mediaSchema';
import { useBanners } from '../banners/bannersApi';
import { useCreateHomepageSection, useUpdateHomepageSection } from './homepageSectionsApi';
import { homepageSectionSchema, homepageSectionFormDefaults } from './homepageSectionSchema';

export function HomepageSectionFormModal({ open, onOpenChange, section }) {
  const isEditMode = Boolean(section);
  const { data: banners = [] } = useBanners();
  const createSection = useCreateHomepageSection();
  const updateSection = useUpdateHomepageSection();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(homepageSectionSchema), defaultValues: homepageSectionFormDefaults });

  const sectionType = watch('type');

  useEffect(() => {
    if (open) {
      reset(
        section
          ? { ...homepageSectionFormDefaults, ...section, banner: section.banner?.id ?? section.banner ?? '' }
          : homepageSectionFormDefaults
      );
    }
  }, [open, section, reset]);

  const onSubmit = async (values) => {
    const payload = { ...values, primaryMedia: toMediaIdForSubmit(values.primaryMedia) };
    try {
      if (isEditMode) {
        await updateSection.mutateAsync({ id: section.id, payload });
        toast.success('Homepage section updated successfully');
      } else {
        await createSection.mutateAsync(payload);
        toast.success('Homepage section created successfully');
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
      title={isEditMode ? 'Edit homepage section' : 'New homepage section'}
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="homepage-section-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save section'}
          </Button>
        </>
      }
    >
      <form id="homepage-section-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          label="Internal title"
          htmlFor="internalTitle"
          required
          description="For admin reference only, not shown on the site"
          error={errors.internalTitle?.message}
        >
          <Input id="internalTitle" {...register('internalTitle')} />
        </FormField>

        <FormField label="Section type" htmlFor="type">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="text_block">Text block</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        {sectionType === 'banner' ? (
          <FormField label="Banner" htmlFor="banner" required error={errors.banner?.message}>
            <Controller
              name="banner"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="banner" className="w-full">
                    <SelectValue placeholder="Select a banner" />
                  </SelectTrigger>
                  <SelectContent>
                    {banners.map((banner) => (
                      <SelectItem key={banner.id} value={banner.id}>
                        {banner.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        ) : (
          <>
            <FormField label="Heading" htmlFor="heading" required error={errors.heading?.message}>
              <Input id="heading" {...register('heading')} />
            </FormField>
            <FormField label="Body" htmlFor="body">
              <Textarea id="body" rows={4} {...register('body')} />
            </FormField>
            <FormField label="Image" description="Optional">
              <Controller
                name="primaryMedia"
                control={control}
                render={({ field }) => (
                  <MediaPicker
                    value={field.value}
                    onChange={field.onChange}
                    entityType="homepage"
                    entityId={section?.id}
                  />
                )}
              />
            </FormField>
          </>
        )}

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
      </form>
    </Modal>
  );
}
