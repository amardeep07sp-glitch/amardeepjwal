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
import { useCategoryTree, useCreateCategory, useUpdateCategory } from './categoriesApi';
import { categorySchema, categoryFormDefaults, CATEGORY_STATUSES, NO_PARENT_VALUE } from './categorySchema';
import { flattenTreeForParentOptions } from './categoryTreeOptions';

function SectionLabel({ children }) {
  return <p className="text-sm font-medium text-heading">{children}</p>;
}

export function CategoryFormModal({ open, onOpenChange, category }) {
  const isEditMode = Boolean(category);

  const { data: tree = [] } = useCategoryTree();
  const parentOptions = flattenTreeForParentOptions(tree, category?.id);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(categorySchema), defaultValues: categoryFormDefaults });

  useEffect(() => {
    if (open) {
      reset(
        category
          ? { ...categoryFormDefaults, ...category, parent: category.parent?.id ?? NO_PARENT_VALUE }
          : categoryFormDefaults
      );
    }
  }, [open, category, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      parent: values.parent === NO_PARENT_VALUE ? null : values.parent,
      iconMedia: toMediaIdForSubmit(values.iconMedia),
      bannerMedia: toMediaIdForSubmit(values.bannerMedia),
      thumbnailMedia: toMediaIdForSubmit(values.thumbnailMedia),
      seo: { ...values.seo, ogImageMedia: toMediaIdForSubmit(values.seo?.ogImageMedia) },
    };
    try {
      if (isEditMode) {
        await updateCategory.mutateAsync({ id: category.id, payload });
        toast.success('Category updated successfully');
      } else {
        await createCategory.mutateAsync(payload);
        toast.success('Category created successfully');
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
      title={isEditMode ? 'Edit category' : 'New category'}
      className="sm:max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save category'}
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1"
      >
        <SectionLabel>General</SectionLabel>
        <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register('name')} />
        </FormField>
        <FormField
          label="Slug"
          htmlFor="slug"
          description="Leave blank to auto-generate from the name"
          error={errors.slug?.message}
        >
          <Input id="slug" placeholder="e.g. gold-rings" {...register('slug')} />
        </FormField>
        <FormField label="Parent category" htmlFor="parent" description="Unlimited nesting depth is supported">
          <Controller
            name="parent"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="parent" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT_VALUE}>None (top-level category)</SelectItem>
                  {parentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {'—'.repeat(option.depth)} {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Short description" htmlFor="shortDescription" description="Shown in listing cards">
          <Input id="shortDescription" {...register('shortDescription')} />
        </FormField>
        <FormField label="SKU prefix" htmlFor="skuPrefix" description="Used to auto-generate SKUs for products in this category, e.g. RG">
          <Input id="skuPrefix" placeholder="e.g. RG" className="uppercase" {...register('skuPrefix')} />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={3} {...register('description')} />
        </FormField>
        <FormField label="Order" htmlFor="order" description="Lower numbers appear first">
          <Input id="order" type="number" {...register('order')} />
        </FormField>

        <Separator />
        <SectionLabel>Media</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Icon">
            <Controller
              name="iconMedia"
              control={control}
              render={({ field }) => (
                <MediaPicker
                  value={field.value}
                  onChange={field.onChange}
                  entityType="category"
                  entityId={category?.id}
                />
              )}
            />
          </FormField>
          <FormField label="Thumbnail">
            <Controller
              name="thumbnailMedia"
              control={control}
              render={({ field }) => (
                <MediaPicker
                  value={field.value}
                  onChange={field.onChange}
                  entityType="category"
                  entityId={category?.id}
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
                  entityType="category"
                  entityId={category?.id}
                />
              )}
            />
          </FormField>
        </div>

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
                  {CATEGORY_STATUSES.map((status) => (
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
          <FormField label="Show in navbar">
            <Controller
              name="showInNavbar"
              control={control}
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </FormField>
          <FormField label="Show on homepage">
            <Controller
              name="showOnHomepage"
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
              <MediaPicker
                value={field.value}
                onChange={field.onChange}
                entityType="category"
                entityId={category?.id}
              />
            )}
          />
        </FormField>
      </form>
    </Modal>
  );
}
