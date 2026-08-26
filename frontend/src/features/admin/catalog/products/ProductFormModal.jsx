import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategoryTree } from '../categories/categoriesApi';
import { flattenTreeForParentOptions } from '../categories/categoryTreeOptions';
import { useBrands } from '../brands/brandsApi';
import { useCollections } from '../collections/collectionsApi';
import { useAllAttributeGroups } from '../attribute-groups/attributeGroupsApi';
import { useCreateProduct, useUpdateProduct, useNextSku, useOverrideSku } from './productsApi';
import { PricingTabContent } from './pricing/PricingTabContent';
import { VariantsTabContent } from './variants/VariantsTabContent';
import { MediaManager } from '../../media/MediaManager';
import { MediaPicker } from '../../media/MediaPicker';
import { toMediaIdForSubmit } from '../../media/mediaSchema';
import { InventoryTabContent } from '../../inventory/InventoryTabContent';
import {
  productSchema,
  productFormDefaults,
  CATALOG_STATUSES,
  GENDERS,
  OCCASIONS,
  METALS,
  PURITIES_BY_METAL,
  GEMSTONE_TYPES,
  NO_RELATION_VALUE,
  splitCommaList,
  joinCommaList,
} from './productSchema';

function SectionLabel({ children }) {
  return <p className="text-sm font-medium text-heading">{children}</p>;
}

export function ProductFormModal({ open, onOpenChange, product }) {
  const isEditMode = Boolean(product);
  const [activeTab, setActiveTab] = useState('general');
  const [skuOverrideOpen, setSkuOverrideOpen] = useState(false);
  const [skuOverrideValue, setSkuOverrideValue] = useState('');
  const lastAutoSku = useRef('');

  const { data: categoryTree = [] } = useCategoryTree();
  const categoryOptions = flattenTreeForParentOptions(categoryTree, undefined);
  const { data: brandsData } = useBrands({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const { data: collectionsData } = useCollections({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const { data: attributeGroups = [] } = useAllAttributeGroups();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const overrideSku = useOverrideSku();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(productSchema), defaultValues: productFormDefaults });

  const selectedCategory = watch('category');
  const currentSku = watch('sku');
  const { data: nextSku } = useNextSku(!isEditMode ? selectedCategory : undefined);

  useEffect(() => {
    if (open) {
      setActiveTab('general');
      setSkuOverrideOpen(false);
      lastAutoSku.current = '';
      reset(
        product
          ? {
              ...productFormDefaults,
              ...product,
              category: product.category?.id ?? '',
              brand: product.brand?.id ?? NO_RELATION_VALUE,
              collectionId: product.collectionId?.id ?? NO_RELATION_VALUE,
              attributeGroups: (product.attributeGroups ?? []).map((g) => g.id),
              tagsInput: joinCommaList(product.tags),
              searchKeywordsInput: joinCommaList(product.searchKeywords),
              gender: product.gender ?? NO_RELATION_VALUE,
              occasion: product.occasion ?? [],
              metal: product.metal ?? NO_RELATION_VALUE,
              purity: product.purity ?? '',
              gemstoneType: product.gemstoneType ?? 'none',
            }
          : productFormDefaults
      );
    }
  }, [open, product, reset]);

  // Auto-fills the suggested SKU as the category changes, but never
  // overwrites a value the admin has deliberately typed themselves.
  useEffect(() => {
    if (isEditMode || !nextSku?.sku) return;
    if (!currentSku || currentSku === lastAutoSku.current) {
      setValue('sku', nextSku.sku);
      lastAutoSku.current = nextSku.sku;
    }
  }, [nextSku, isEditMode, currentSku, setValue]);

  const handleSkuOverrideSave = async () => {
    try {
      await overrideSku.mutateAsync({ id: product.id, sku: skuOverrideValue });
      toast.success('SKU updated successfully');
      setValue('sku', skuOverrideValue);
      setSkuOverrideOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onSubmit = async (values) => {
    const { tagsInput, searchKeywordsInput, ...rest } = values;
    const payload = {
      ...rest,
      brand: values.brand === NO_RELATION_VALUE ? null : values.brand,
      collectionId: values.collectionId === NO_RELATION_VALUE ? null : values.collectionId,
      gender: values.gender === NO_RELATION_VALUE ? null : values.gender,
      metal: values.metal === NO_RELATION_VALUE ? null : values.metal,
      // Purity only means something alongside a metal - clearing metal
      // clears any stale purity value rather than silently keeping it.
      purity: values.metal === NO_RELATION_VALUE ? '' : values.purity,
      tags: splitCommaList(tagsInput ?? ''),
      searchKeywords: splitCommaList(searchKeywordsInput ?? ''),
      seo: { ...values.seo, ogImageMedia: toMediaIdForSubmit(values.seo?.ogImageMedia) },
    };

    try {
      if (isEditMode) {
        await updateProduct.mutateAsync({ id: product.id, payload });
        toast.success('Product updated successfully');
      } else {
        await createProduct.mutateAsync(payload);
        toast.success('Product created successfully');
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
      title={isEditMode ? 'Edit product' : 'New product'}
      className="sm:max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {activeTab === 'general' ? 'Cancel' : 'Close'}
          </Button>
          {activeTab === 'general' && (
            <Button type="submit" form="product-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save product'}
            </Button>
          )}
        </>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form
            id="product-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1"
          >
            <SectionLabel>General</SectionLabel>
            <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
              <Input id="name" {...register('name')} />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Slug" htmlFor="slug" description="Leave blank to auto-generate">
                <Input id="slug" {...register('slug')} />
              </FormField>
              <FormField
                label="SKU"
                htmlFor="sku"
                error={errors.sku?.message}
                description={!isEditMode ? 'Auto-generated from category, editable before saving' : undefined}
              >
                {isEditMode ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input id="sku" readOnly className="bg-muted/50" {...register('sku')} />
                      <Button type="button" variant="outline" size="sm" onClick={() => { setSkuOverrideValue(currentSku); setSkuOverrideOpen((prev) => !prev); }}>
                        Change SKU
                      </Button>
                    </div>
                    {skuOverrideOpen && (
                      <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 p-2">
                        <Input
                          value={skuOverrideValue}
                          onChange={(e) => setSkuOverrideValue(e.target.value)}
                          placeholder="New SKU"
                        />
                        <Button type="button" size="sm" onClick={handleSkuOverrideSave} disabled={overrideSku.isPending}>
                          {overrideSku.isPending ? 'Saving...' : 'Confirm'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Input id="sku" placeholder="e.g. RING-001" {...register('sku')} />
                )}
              </FormField>
            </div>
            <FormField label="Short description" htmlFor="shortDescription">
              <Input id="shortDescription" {...register('shortDescription')} />
            </FormField>
            <FormField label="Description" htmlFor="description">
              <Textarea id="description" rows={3} {...register('description')} />
            </FormField>
            <FormField label="Order" htmlFor="order" description="Lower numbers appear first">
              <Input id="order" type="number" {...register('order')} />
            </FormField>

            <Separator />
            <SectionLabel>Relations</SectionLabel>
            <FormField label="Category" htmlFor="category" required error={errors.category?.message}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {'—'.repeat(option.depth)} {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Brand" htmlFor="brand">
                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="brand" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_RELATION_VALUE}>None</SelectItem>
                        {(brandsData?.items ?? []).map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Collection" htmlFor="collectionId">
                <Controller
                  name="collectionId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="collectionId" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_RELATION_VALUE}>None</SelectItem>
                        {(collectionsData?.items ?? []).map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <FormField label="Attribute groups" description="Which attribute groups apply to this product">
              <Controller
                name="attributeGroups"
                control={control}
                render={({ field }) => (
                  <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border border-border p-3">
                    {attributeGroups.length === 0 && (
                      <p className="text-sm text-muted-foreground">No attribute groups yet.</p>
                    )}
                    {attributeGroups.map((group) => {
                      const checked = field.value.includes(group.id);
                      return (
                        <label key={group.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) =>
                              field.onChange(
                                isChecked
                                  ? [...field.value, group.id]
                                  : field.value.filter((id) => id !== group.id)
                              )
                            }
                          />
                          {group.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Gender" htmlFor="gender" description="Which audience this product is shown to on the storefront">
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="gender" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_RELATION_VALUE}>None</SelectItem>
                        {GENDERS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <FormField label="Occasion" description="Storefront filter facet - a product can suit more than one">
              <Controller
                name="occasion"
                control={control}
                render={({ field }) => (
                  <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border p-3">
                    {OCCASIONS.map((option) => {
                      const checked = field.value.includes(option.value);
                      return (
                        <label key={option.value} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) =>
                              field.onChange(
                                isChecked
                                  ? [...field.value, option.value]
                                  : field.value.filter((value) => value !== option.value)
                              )
                            }
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </FormField>

            <Separator />
            <SectionLabel>Jewellery Details</SectionLabel>
            <p className="-mt-2 text-xs text-muted-foreground">
              Real classification the promotion engine relies on (e.g. "20% off Gold") - not the optional Attribute system.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Metal" htmlFor="metal">
                <Controller
                  name="metal"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue('purity', '');
                      }}
                    >
                      <SelectTrigger id="metal" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_RELATION_VALUE}>None</SelectItem>
                        {METALS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField label="Purity" htmlFor="purity">
                <Controller
                  name="purity"
                  control={control}
                  render={({ field }) => {
                    const metalValue = watch('metal');
                    const purityOptions = PURITIES_BY_METAL[metalValue] ?? [];
                    return (
                      <Select value={field.value} onValueChange={field.onChange} disabled={purityOptions.length === 0}>
                        <SelectTrigger id="purity" className="w-full">
                          <SelectValue placeholder={purityOptions.length ? 'Select purity' : 'Select a metal first'} />
                        </SelectTrigger>
                        <SelectContent>
                          {purityOptions.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
              </FormField>

              <FormField label="Gemstone" htmlFor="gemstoneType">
                <Controller
                  name="gemstoneType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="gemstoneType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GEMSTONE_TYPES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>

            <FormField label="Tags" htmlFor="tagsInput" description="Comma-separated">
              <Input id="tagsInput" placeholder="gold, bridal, lightweight" {...register('tagsInput')} />
            </FormField>
            <FormField
              label="Search keywords"
              htmlFor="searchKeywordsInput"
              description="Comma-separated, for internal search matching"
            >
              <Input id="searchKeywordsInput" {...register('searchKeywordsInput')} />
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
            <FormField label="OG image" description="Used when this product is shared on social media">
              <Controller
                name="seo.ogImageMedia"
                control={control}
                render={({ field }) => (
                  <MediaPicker
                    value={field.value}
                    onChange={field.onChange}
                    entityType="product"
                    entityId={product?.id}
                  />
                )}
              />
            </FormField>
          </form>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {isEditMode ? (
              <PricingTabContent productId={product.id} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Save the product first, then come back here to set its pricing.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="variants">
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {isEditMode ? (
              <VariantsTabContent productId={product.id} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Save the product first, then come back here to create variants.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="media">
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {isEditMode ? (
              <MediaManager entityType="product" entityId={product.id} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Save the product first, then come back here to upload images and videos.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {isEditMode ? (
              <InventoryTabContent productId={product.id} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Save the product first - its inventory record is provisioned automatically.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Modal>
  );
}
