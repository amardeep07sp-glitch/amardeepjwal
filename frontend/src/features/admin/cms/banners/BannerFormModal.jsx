import { useEffect, useState } from 'react';
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
import { useCreateBanner, useUpdateBanner } from './bannersApi';
import { bannerSchema, bannerFormDefaults, BANNER_POSITIONS } from './bannerSchema';

export function BannerFormModal({ open, onOpenChange, banner }) {
  // Starts as the `banner` prop (null for a brand-new banner), but can
  // move to a just-created banner below - MediaPicker needs a real id to
  // upload against (Media rows are scoped to an existing entityId), so
  // rather than making the user save, close, reopen in edit mode, and
  // find the image field themselves, the first save quietly switches this
  // modal into edit mode in place and the image picker unlocks right there.
  const [activeBanner, setActiveBanner] = useState(banner);
  const isEditMode = Boolean(activeBanner);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(bannerSchema), defaultValues: bannerFormDefaults });

  useEffect(() => {
    if (open) {
      setActiveBanner(banner);
      reset(banner ? { ...bannerFormDefaults, ...banner } : bannerFormDefaults);
    }
  }, [open, banner, reset]);

  const onSubmit = async (values) => {
    const payload = { ...values, primaryMedia: toMediaIdForSubmit(values.primaryMedia) };
    try {
      if (isEditMode) {
        await updateBanner.mutateAsync({ id: activeBanner.id, payload });
        toast.success('Banner updated successfully');
        onOpenChange(false);
      } else {
        const created = await createBanner.mutateAsync(payload);
        toast.success('Banner created - now add an image below.');
        setActiveBanner(created.data);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit banner' : 'New banner'}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {isEditMode && !banner ? 'Done' : 'Cancel'}
          </Button>
          <Button type="submit" form="banner-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save banner' : 'Create & Continue'}
          </Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
          <Input id="title" {...register('title')} />
        </FormField>

        <FormField label="Subtitle" htmlFor="subtitle" description="Eyebrow text shown above the title (e.g. a hero slide's tagline)">
          <Input id="subtitle" {...register('subtitle')} />
        </FormField>

        <FormField label="Description" htmlFor="description" description="Shown below the title on a hero slide">
          <Textarea id="description" rows={2} {...register('description')} />
        </FormField>

        <FormField label="Button Label" htmlFor="ctaLabel" description="e.g. 'Shop Now' - shown only if Link URL is set too">
          <Input id="ctaLabel" {...register('ctaLabel')} />
        </FormField>

        <FormField
          label="Image"
          description={
            activeBanner ? 'Required before this banner can be activated' : 'Save the banner first - a title is enough to continue'
          }
        >
          <Controller
            name="primaryMedia"
            control={control}
            render={({ field }) => (
              <MediaPicker value={field.value} onChange={field.onChange} entityType="banner" entityId={activeBanner?.id} />
            )}
          />
        </FormField>

        <FormField label="Link URL" htmlFor="linkUrl" description="Optional - where the banner should link to">
          <Input id="linkUrl" {...register('linkUrl')} />
        </FormField>

        <FormField label="Alt text" htmlFor="altText" description="For accessibility and SEO">
          <Input id="altText" {...register('altText')} />
        </FormField>

        <FormField label="Position" htmlFor="position">
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="position" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_POSITIONS.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
      </form>
    </Modal>
  );
}
