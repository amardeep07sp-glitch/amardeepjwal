import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaPicker } from '../../media/MediaPicker';
import { toMediaIdForSubmit } from '../../media/mediaSchema';
import { useCreateCollection, useUpdateCollection, useCollections } from './collectionsApi';
import { RuleBuilder } from './RuleBuilder';
import { ProductAssignmentPicker } from './ProductAssignmentPicker';
import { ProductReorderList, ProductOrderPreview } from './ProductReorderList';
import { CollectionPreviewTab } from './CollectionPreviewTab';
import { CollectionAnalyticsTab } from './CollectionAnalyticsTab';
import {
  collectionSchema,
  collectionFormDefaults,
  CATALOG_STATUSES,
  COLLECTION_TYPE_OPTIONS,
  ASSIGNMENT_TYPE_OPTIONS,
  SORT_MODE_OPTIONS,
  VISIBILITY_OPTIONS,
} from './collectionSchema';

const FORM_TAB_VALUES = ['general', 'rules', 'products', 'merchandising', 'schedule', 'media', 'seo'];
const NO_CAMPAIGN_VALUE = '__none__';

function SectionLabel({ children }) {
  return <p className="text-sm font-medium text-heading">{children}</p>;
}

// A datetime-local input needs "YYYY-MM-DDTHH:mm", not a full ISO string
// with seconds/timezone - trims it down; the reverse conversion is a no-op
// since z.coerce.date() on the backend parses that shortened string as
// local time exactly the way a native date input's value is meant to be
// read.
function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toISOString().slice(0, 16);
}

export function CollectionFormModal({ open, onOpenChange, collection }) {
  const isEditMode = Boolean(collection);
  const [activeTab, setActiveTab] = useState('general');
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();

  const { data: collectionsData } = useCollections({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const relationOptions = (collectionsData?.items ?? []).filter((c) => c.id !== collection?.id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(collectionSchema), defaultValues: collectionFormDefaults });

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: 'faqs' });

  useEffect(() => {
    if (open) {
      setActiveTab('general');
      reset(
        collection
          ? {
              ...collectionFormDefaults,
              ...collection,
              relatedCollections: (collection.relatedCollections ?? []).map((c) => c.id),
              parentCampaign: collection.parentCampaign?.id ?? null,
              startDate: toDatetimeLocalValue(collection.startDate) || null,
              endDate: toDatetimeLocalValue(collection.endDate) || null,
            }
          : collectionFormDefaults
      );
    }
  }, [open, collection, reset]);

  const values = watch();
  const assignmentType = watch('assignmentType');
  const sortMode = watch('sortMode');
  const isFormTab = FORM_TAB_VALUES.includes(activeTab);

  const onSubmit = async (formValues) => {
    const payload = {
      ...formValues,
      bannerMedia: toMediaIdForSubmit(formValues.bannerMedia),
      thumbnailMedia: toMediaIdForSubmit(formValues.thumbnailMedia),
      mobileBannerMedia: toMediaIdForSubmit(formValues.mobileBannerMedia),
      promoVideoMedia: toMediaIdForSubmit(formValues.promoVideoMedia),
      parentCampaign: formValues.parentCampaign || null,
      startDate: formValues.startDate || null,
      endDate: formValues.endDate || null,
      seo: { ...formValues.seo, ogImageMedia: toMediaIdForSubmit(formValues.seo?.ogImageMedia) },
    };

    try {
      if (isEditMode) {
        await updateCollection.mutateAsync({ id: collection.id, payload });
        toast.success('Collection updated successfully');
      } else {
        await createCollection.mutateAsync(payload);
        toast.success('Collection created successfully');
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
      title={isEditMode ? 'Edit collection' : 'New collection'}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {isFormTab ? 'Cancel' : 'Close'}
          </Button>
          {isFormTab && (
            <Button type="submit" form="collection-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save collection'}
            </Button>
          )}
        </>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="general">General</TabsTrigger>
            {assignmentType === 'rule_based' && <TabsTrigger value="rules">Rules</TabsTrigger>}
            {assignmentType === 'manual' && <TabsTrigger value="products">Products</TabsTrigger>}
            <TabsTrigger value="merchandising">Merchandising</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            {isEditMode && <TabsTrigger value="preview">Preview</TabsTrigger>}
            {isEditMode && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="general">
          <form
            id="collection-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1"
          >
            <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
              <Input id="name" {...register('name')} />
            </FormField>
            <FormField label="Slug" htmlFor="slug" description="Leave blank to auto-generate">
              <Input id="slug" placeholder="e.g. wedding-edit" {...register('slug')} />
            </FormField>
            <FormField label="Short description" htmlFor="shortDescription" description="Shown on collection cards and the landing hero">
              <Input id="shortDescription" {...register('shortDescription')} />
            </FormField>
            <FormField label="Long description" htmlFor="description">
              <Textarea id="description" rows={3} {...register('description')} />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        {COLLECTION_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Product assignment" htmlFor="assignmentType">
                <Controller
                  name="assignmentType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="assignmentType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNMENT_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            <FormField label="Order" htmlFor="order" description="Lower numbers appear first">
              <Input id="order" type="number" {...register('order')} />
            </FormField>

            <Separator />
            <SectionLabel>Relationships</SectionLabel>
            <FormField label="Related collections" description="Shown on the customer landing page">
              <Controller
                name="relatedCollections"
                control={control}
                render={({ field }) => (
                  <div className="flex max-h-32 flex-col gap-2 overflow-y-auto rounded-lg border border-border p-3">
                    {relationOptions.length === 0 && <p className="text-sm text-muted-foreground">No other collections yet.</p>}
                    {relationOptions.map((opt) => {
                      const checked = field.value.includes(opt.id);
                      return (
                        <label key={opt.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              field.onChange(e.target.checked ? [...field.value, opt.id] : field.value.filter((id) => id !== opt.id))
                            }
                          />
                          {opt.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </FormField>
            <FormField label="Parent campaign" htmlFor="parentCampaign" description="Groups this collection under a broader campaign">
              <Controller
                name="parentCampaign"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? NO_CAMPAIGN_VALUE} onValueChange={(v) => field.onChange(v === NO_CAMPAIGN_VALUE ? null : v)}>
                    <SelectTrigger id="parentCampaign" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CAMPAIGN_VALUE}>None</SelectItem>
                      {relationOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <Separator />
            <SectionLabel>Visibility</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <FormField label="Audience" htmlFor="visibility" description="Members/VIP are admin-ready but not yet enforced (no customer login system)">
                <Controller
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="visibility" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Visible on storefront">
                <Controller name="isVisible" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
              </FormField>
              <FormField label="Featured">
                <Controller name="isFeatured" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
              </FormField>
            </div>
          </form>
        </TabsContent>

        {assignmentType === 'rule_based' && (
          <TabsContent value="rules">
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <Controller name="rules" control={control} render={({ field }) => <RuleBuilder rules={field.value} onChange={field.onChange} />} />
            </div>
          </TabsContent>
        )}

        {assignmentType === 'manual' && (
          <TabsContent value="products">
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {isEditMode ? (
                <ProductAssignmentPicker collectionId={collection.id} />
              ) : (
                <EmptyState title="Save the collection first" description="Product assignment is available once the collection exists." />
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="merchandising">
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
            <FormField label="Sort mode" htmlFor="sortMode">
              <Controller
                name="sortMode"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sortMode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_MODE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            {!isEditMode ? (
              <EmptyState title="Save the collection first" description="Merchandising order is available once the collection exists." />
            ) : sortMode === 'manual' ? (
              <ProductReorderList collectionId={collection.id} />
            ) : (
              <ProductOrderPreview collectionId={collection.id} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Start date" htmlFor="startDate">
                <Input id="startDate" type="datetime-local" {...register('startDate')} />
              </FormField>
              <FormField label="End date" htmlFor="endDate" error={errors.endDate?.message}>
                <Input id="endDate" type="datetime-local" {...register('endDate')} />
              </FormField>
            </div>
            <FormField label="Auto publish" description="Flips Draft → Published once the start date passes (checked every 15 min)">
              <Controller name="autoPublish" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            </FormField>
            <FormField label="Auto archive" description="Flips Published → Archived once the end date passes (checked every 15 min)">
              <Controller name="autoArchive" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            </FormField>
          </div>
        </TabsContent>

        <TabsContent value="media">
          <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
            <FormField label="Banner (desktop)">
              <Controller name="bannerMedia" control={control} render={({ field }) => <MediaPicker value={field.value} onChange={field.onChange} entityType="collection" entityId={collection?.id} aspect="aspect-16/9" />} />
            </FormField>
            <FormField label="Mobile banner">
              <Controller name="mobileBannerMedia" control={control} render={({ field }) => <MediaPicker value={field.value} onChange={field.onChange} entityType="collection" entityId={collection?.id} aspect="aspect-4/5" />} />
            </FormField>
            <FormField label="Thumbnail">
              <Controller name="thumbnailMedia" control={control} render={({ field }) => <MediaPicker value={field.value} onChange={field.onChange} entityType="collection" entityId={collection?.id} />} />
            </FormField>
            <FormField label="Promo video">
              <Controller
                name="promoVideoMedia"
                control={control}
                render={({ field }) => (
                  <MediaPicker value={field.value} onChange={field.onChange} entityType="collection" entityId={collection?.id} mediaType="video" aspect="aspect-16/9" />
                )}
              />
            </FormField>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
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
              <Controller name="seo.ogImageMedia" control={control} render={({ field }) => <MediaPicker value={field.value} onChange={field.onChange} entityType="collection" entityId={collection?.id} />} />
            </FormField>

            <Separator />
            <div className="flex items-center justify-between">
              <SectionLabel>FAQ</SectionLabel>
              <Button type="button" variant="outline" size="sm" onClick={() => appendFaq({ question: '', answer: '' })}>
                <Plus className="size-3.5" />
                Add question
              </Button>
            </div>
            {faqFields.length === 0 && <p className="text-sm text-muted-foreground">No FAQ entries yet.</p>}
            {faqFields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Input placeholder="Question" {...register(`faqs.${index}.question`)} />
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove FAQ" onClick={() => removeFaq(index)}>
                    <X className="size-4 text-destructive" />
                  </Button>
                </div>
                <Textarea placeholder="Answer" rows={2} {...register(`faqs.${index}.answer`)} />
              </div>
            ))}
          </div>
        </TabsContent>

        {isEditMode && (
          <TabsContent value="preview">
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <CollectionPreviewTab collectionId={collection.id} values={values} />
            </div>
          </TabsContent>
        )}

        {isEditMode && (
          <TabsContent value="analytics">
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <CollectionAnalyticsTab collectionId={collection.id} viewCount={collection.viewCount} clickCount={collection.clickCount} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Modal>
  );
}
