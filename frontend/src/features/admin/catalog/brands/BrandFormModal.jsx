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
import { MediaPicker } from '../../media/MediaPicker';
import { toMediaIdForSubmit } from '../../media/mediaSchema';
import { useCreateBrand, useUpdateBrand } from './brandsApi';
import { brandSchema, brandFormDefaults, CATALOG_STATUSES } from './brandSchema';

function SectionLabel({ children }) {
  return <p className="text-sm font-medium text-heading">{children}</p>;
}

export function BrandFormModal({ open, onOpenChange, brand }) {
  const isEditMode = Boolean(brand);
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(brandSchema), defaultValues: brandFormDefaults });

  useEffect(() => {
    if (open) {
      reset(brand ? { ...brandFormDefaults, ...brand } : brandFormDefaults);
    }
  }, [open, brand, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      logoMedia: toMediaIdForSubmit(values.logoMedia),
      bannerMedia: toMediaIdForSubmit(values.bannerMedia),
      seo: { ...values.seo, ogImageMedia: toMediaIdForSubmit(values.seo?.ogImageMedia) },
    };

    try {
      if (isEditMode) {
        await updateBrand.mutateAsync({ id: brand.id, payload });
        toast.success('Brand updated successfully');
      } else {
        await createBrand.mutateAsync(payload);
        toast.success('Brand created successfully');
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
      title={isEditMode ? 'Edit brand' : 'New brand'}
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="brand-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save brand'}
          </Button>
        </>
      }
    >
      <form
        id="brand-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1"
      >
        <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register('name')} />
        </FormField>
        <FormField label="Slug" htmlFor="slug" description="Leave blank to auto-generate">
          <Input id="slug" placeholder="e.g. tanishq" {...register('slug')} />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={3} {...register('description')} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Country" htmlFor="country">
            <Input id="country" {...register('country')} />
          </FormField>
          <FormField label="Website" htmlFor="website">
            <Input id="website" placeholder="https://..." {...register('website')} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Logo">
            <Controller
              name="logoMedia"
              control={control}
              render={({ field }) => (
                <MediaPicker
                  value={field.value}
                  onChange={field.onChange}
                  entityType="brand"
                  entityId={brand?.id}
                />
              )}
            />
          </FormField>
          <FormField label="Banner">
            <Controller
              name="bannerMedia"
              control={control}
              render={({ field }) => (
                <MediaPicker
                  value={field.value}
                  onChange={field.onChange}
                  entityType="brand"
                  entityId={brand?.id}
                />
              )}
            />
          </FormField>
        </div>
        <FormField label="Order" htmlFor="order" description="Lower numbers appear first">
          <Input id="order" type="number" {...register('order')} />
        </FormField>

        <Separator />
        <SectionLabel>Visibility</SectionLabel>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Visible on storefront">
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
        </div>

        <Separator />
        <SectionLabel>SEO</SectionLabel>
        <FormField label="Meta title" htmlFor="seo.metaTitle">
          <Input id="seo.metaTitle" {...register('seo.metaTitle')} />
        </FormField>
        <FormField label="Meta description" htmlFor="seo.metaDescription">
          <Textarea id="seo.metaDescription" rows={2} {...register('seo.metaDescription')} />
        </FormField>
        <FormField label="Meta keywords" htmlFor="seo.metaKeywords" description="Comma-separated">
          <Input id="seo.metaKeywords" {...register('seo.metaKeywords')} />
        </FormField>
        <FormField label="Canonical URL" htmlFor="seo.canonicalUrl">
          <Input id="seo.canonicalUrl" {...register('seo.canonicalUrl')} />
        </FormField>
        <FormField label="OG image">
          <Controller
            name="seo.ogImageMedia"
            control={control}
            render={({ field }) => (
              <MediaPicker value={field.value} onChange={field.onChange} entityType="brand" entityId={brand?.id} />
            )}
          />
        </FormField>
      </form>
    </Modal>
  );
}
