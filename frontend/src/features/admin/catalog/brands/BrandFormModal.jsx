import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

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
import { brandSchema, brandFormDefaults, CATALOG_STATUSES, BRAND_SHOWCASE_ICONS } from './brandSchema';

function SectionLabel({ children }) {
  return <p className="text-sm font-medium text-heading">{children}</p>;
}

// Backs all three of the showcase's repeatable card lists (editions,
// craft pillars, trust benefits) - same add/remove/field shape each time,
// just a different set of inputs per `fields` config.
function RepeatableCardList({ control, register, name, addLabel, emptyHint, fields: fieldConfigs }) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 && <p className="text-xs text-muted-foreground">{emptyHint}</p>}
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              {fieldConfigs.map((cfg) =>
                cfg.type === 'icon' ? (
                  <FormField key={cfg.key} label={cfg.label}>
                    <Controller
                      control={control}
                      name={`${name}.${index}.${cfg.key}`}
                      render={({ field: iconField }) => (
                        <Select value={iconField.value || ''} onValueChange={iconField.onChange}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="No icon" /></SelectTrigger>
                          <SelectContent>
                            {BRAND_SHOWCASE_ICONS.map((icon) => (
                              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                ) : (
                  <FormField key={cfg.key} label={cfg.label} className={cfg.wide ? 'sm:col-span-2' : ''}>
                    {cfg.type === 'textarea' ? (
                      <Textarea rows={2} {...register(`${name}.${index}.${cfg.key}`)} />
                    ) : (
                      <Input {...register(`${name}.${index}.${cfg.key}`)} />
                    )}
                  </FormField>
                )
              )}
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)} aria-label="Remove">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => append(Object.fromEntries(fieldConfigs.map((cfg) => [cfg.key, ''])))}
      >
        <Plus className="size-3.5" /> {addLabel}
      </Button>
    </div>
  );
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
      showcase: {
        ...values.showcase,
        heroImageMedia: toMediaIdForSubmit(values.showcase?.heroImageMedia),
        storyImageMedia: toMediaIdForSubmit(values.showcase?.storyImageMedia),
      },
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
        <SectionLabel>Showcase page (optional)</SectionLabel>
        <p className="-mt-2 text-xs text-muted-foreground">
          Fill this in to render this brand as a full flagship landing page instead of a plain product grid - see
          "Mudrika" for an example. Leave blank for a regular brand.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Hero tagline" htmlFor="showcase.heroTagline" description="e.g. The Art of Regal Adornment">
            <Input id="showcase.heroTagline" {...register('showcase.heroTagline')} />
          </FormField>
          <FormField label="Hero name in local script" htmlFor="showcase.heroLocalName" description="e.g. मुद्रिका">
            <Input id="showcase.heroLocalName" {...register('showcase.heroLocalName')} />
          </FormField>
        </div>
        <FormField label="Hero background image">
          <Controller
            name="showcase.heroImageMedia"
            control={control}
            render={({ field }) => <MediaPicker value={field.value} onChange={field.onChange} entityType="brand" entityId={brand?.id} />}
          />
        </FormField>

        <FormField label="Story title" htmlFor="showcase.storyTitle">
          <Input id="showcase.storyTitle" {...register('showcase.storyTitle')} />
        </FormField>
        <FormField label="Story body" htmlFor="showcase.storyBody">
          <Textarea id="showcase.storyBody" rows={4} {...register('showcase.storyBody')} />
        </FormField>
        <FormField label="Story image">
          <Controller
            name="showcase.storyImageMedia"
            control={control}
            render={({ field }) => <MediaPicker value={field.value} onChange={field.onChange} entityType="brand" entityId={brand?.id} />}
          />
        </FormField>

        <SectionLabel>Collection filter chips</SectionLabel>
        <RepeatableCardList
          control={control}
          register={register}
          name="showcase.editions"
          addLabel="Add filter chip"
          emptyHint="No filter chips yet - the showcase will just show one 'All' tab."
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'localName', label: 'Local script name' },
            { key: 'tagline', label: 'Tagline' },
            { key: 'categorySlug', label: 'Category slug to filter by' },
          ]}
        />

        <SectionLabel>Craft process steps</SectionLabel>
        <RepeatableCardList
          control={control}
          register={register}
          name="showcase.craftPillars"
          addLabel="Add step"
          emptyHint="No craft process steps yet."
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'description', label: 'Description', type: 'textarea', wide: true },
          ]}
        />

        <SectionLabel>Trust benefits</SectionLabel>
        <RepeatableCardList
          control={control}
          register={register}
          name="showcase.trustBenefits"
          addLabel="Add benefit"
          emptyHint="No trust benefits yet."
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'description', label: 'Description', type: 'textarea', wide: true },
          ]}
        />

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
