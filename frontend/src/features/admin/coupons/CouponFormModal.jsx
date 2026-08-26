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
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NO_RELATION_VALUE } from '../catalog/products/productSchema';
import { useAllCampaigns } from '../campaigns/campaignsApi';
import { useCoupon, useCreateCoupon, useUpdateCoupon } from './couponsApi';
import { CouponScopeBuilder } from './CouponScopeBuilder';
import { CouponEligibilityBuilder } from './CouponEligibilityBuilder';
import {
  couponSchema,
  couponFormDefaults,
  COUPON_DISCOUNT_TYPES,
  DISCOUNT_BASES,
  COUPON_MANUAL_STATUSES,
  CANCELLATION_POLICIES,
} from './couponSchema';

// A datetime-local input needs "YYYY-MM-DDTHH:mm" - same helper the old
// v1 CouponFormModal used.
function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toISOString().slice(0, 16);
}

// The API's populated ref shape ({id, name} | {id, name, sku} | raw id
// string) -> the form's {id, label} shape EntitySearchPicker renders.
function toLabeledEntities(refs, { withSub = false } = {}) {
  return (refs ?? [])
    .filter((r) => r && typeof r === 'object')
    .map((r) => ({ id: r.id, label: withSub && r.sku ? `${r.name} (${r.sku})` : r.name }));
}

// Populated refs that are plain strings (list queries never populate) fall
// back to their raw id with no name - only ever hit if a coupon is edited
// from a context that skipped the populated fetch, which CouponFormModal
// never does (it always reads from useCoupons' cached list as a fallback
// only before the dedicated fetch resolves - see the `coupon` prop below).
function toIdArray(refs) {
  return (refs ?? []).map((r) => (typeof r === 'object' && r ? r.id : r));
}

export function CouponFormModal({ open, onOpenChange, coupon }) {
  const isEditMode = Boolean(coupon);
  const [activeTab, setActiveTab] = useState('basics');
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const { data: fullCoupon, isLoading: isCouponLoading } = useCoupon(coupon?.id, { enabled: open && isEditMode });
  const { data: campaignsData } = useAllCampaigns();
  const campaignOptions = campaignsData?.items ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(couponSchema), defaultValues: couponFormDefaults });

  const discountType = watch('discountType');

  useEffect(() => {
    if (!open) return;
    if (!isEditMode) {
      reset(couponFormDefaults);
      setActiveTab('basics');
      return;
    }
    if (!fullCoupon) return; // wait for the populated fetch before hydrating the form
    reset({
      ...couponFormDefaults,
      ...fullCoupon,
      campaignId: fullCoupon.campaignId?.id ?? NO_RELATION_VALUE,
      maxDiscountAmount: fullCoupon.maxDiscountAmount ?? '',
      minOrderValue: fullCoupon.minOrderValue ?? '',
      maximumCartValue: fullCoupon.maximumCartValue ?? '',
      usageLimit: fullCoupon.usageLimit ?? '',
      dailyUsageLimit: fullCoupon.dailyUsageLimit ?? '',
      buyXGetY: { buyQuantity: 1, getQuantity: 1, getDiscountPercentage: 100, ...fullCoupon.buyXGetY },
      validFrom: toDatetimeLocalValue(fullCoupon.validFrom),
      validUntil: toDatetimeLocalValue(fullCoupon.validUntil),
      scope: {
        ...couponFormDefaults.scope,
        ...fullCoupon.scope,
        includeProducts: toLabeledEntities(fullCoupon.scope?.includeProducts, { withSub: true }),
        excludeProducts: toLabeledEntities(fullCoupon.scope?.excludeProducts, { withSub: true }),
        includeCategories: toIdArray(fullCoupon.scope?.includeCategories),
        excludeCategories: toIdArray(fullCoupon.scope?.excludeCategories),
        includeCollections: toIdArray(fullCoupon.scope?.includeCollections),
        excludeCollections: toIdArray(fullCoupon.scope?.excludeCollections),
        includeBrands: toIdArray(fullCoupon.scope?.includeBrands),
        excludeBrands: toIdArray(fullCoupon.scope?.excludeBrands),
      },
      eligibility: {
        ...couponFormDefaults.eligibility,
        ...fullCoupon.eligibility,
        selectedCustomers: toLabeledEntities(fullCoupon.eligibility?.selectedCustomers),
      },
    });
    setActiveTab('basics');
  }, [open, isEditMode, fullCoupon, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      campaignId: values.campaignId === NO_RELATION_VALUE ? null : values.campaignId,
      // free_shipping/buy_x_get_y compute their own discount independent of
      // discountValue (see backend discount.service.js) - it's still a
      // required field server-side, so a neutral 0 goes through instead of
      // showing the admin a meaningless input for those two types.
      discountValue: ['free_shipping', 'buy_x_get_y'].includes(values.discountType) ? 0 : values.discountValue,
      scope: {
        ...values.scope,
        includeProducts: toIdArray(values.scope.includeProducts),
        excludeProducts: toIdArray(values.scope.excludeProducts),
      },
      eligibility: {
        ...values.eligibility,
        selectedCustomers: toIdArray(values.eligibility.selectedCustomers),
      },
    };

    try {
      if (isEditMode) {
        await updateCoupon.mutateAsync({ id: coupon.id, payload });
        toast.success('Coupon updated successfully');
      } else {
        await createCoupon.mutateAsync(payload);
        toast.success('Coupon created successfully');
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
      title={isEditMode ? 'Edit coupon' : 'New coupon'}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" disabled={isSubmitting || (isEditMode && isCouponLoading)}>
            {isSubmitting ? 'Saving...' : 'Save coupon'}
          </Button>
        </>
      }
    >
      {isEditMode && isCouponLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading coupon...</p>
      ) : (
      <form id="coupon-form" onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="discount">Discount</TabsTrigger>
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="basics">
            <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Code" htmlFor="code" required description="Shown to customers, e.g. DIWALI25" error={errors.code?.message}>
                  <Input id="code" className="uppercase" placeholder="DIWALI25" {...register('code')} />
                </FormField>
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
                          {COUPON_MANUAL_STATUSES.map((opt) => (
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

              <FormField label="Description" htmlFor="description">
                <Textarea id="description" rows={2} placeholder="Internal note, not shown to customers" {...register('description')} />
              </FormField>

              <FormField label="Campaign" htmlFor="campaignId" description="Groups this code under a shared budget and marketing intent (optional)">
                <Controller
                  name="campaignId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="campaignId" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_RELATION_VALUE}>No campaign</SelectItem>
                        {campaignOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Valid from" htmlFor="validFrom" required error={errors.validFrom?.message}>
                  <Input id="validFrom" type="datetime-local" {...register('validFrom')} />
                </FormField>
                <FormField label="Valid until" htmlFor="validUntil" required error={errors.validUntil?.message}>
                  <Input id="validUntil" type="datetime-local" {...register('validUntil')} />
                </FormField>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Controller name="isPrivate" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                Private (not shown on any "available offers" listing - customers must already know the code)
              </label>
            </div>
          </TabsContent>

          <TabsContent value="discount">
            <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Discount type" htmlFor="discountType" required>
                  <Controller
                    name="discountType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="discountType" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUPON_DISCOUNT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                <FormField label="Discount base" htmlFor="discountBase" description={DISCOUNT_BASES.find((b) => b.value === watch('discountBase'))?.description}>
                  <Controller
                    name="discountBase"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="discountBase" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DISCOUNT_BASES.map((base) => (
                            <SelectItem key={base.value} value={base.value}>
                              {base.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              {discountType === 'buy_x_get_y' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField label="Buy quantity" htmlFor="buyQuantity">
                    <Input id="buyQuantity" type="number" min="1" {...register('buyXGetY.buyQuantity')} />
                  </FormField>
                  <FormField label="Get quantity" htmlFor="getQuantity">
                    <Input id="getQuantity" type="number" min="1" {...register('buyXGetY.getQuantity')} />
                  </FormField>
                  <FormField label="Get discount %" htmlFor="getDiscountPercentage" description="100 = free">
                    <Input id="getDiscountPercentage" type="number" min="0" max="100" {...register('buyXGetY.getDiscountPercentage')} />
                  </FormField>
                </div>
              ) : discountType === 'free_shipping' ? (
                <p className="text-sm text-muted-foreground">Free Shipping discounts the order's real shipping charge - no discount value needed.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label={discountType === 'percentage' ? 'Discount percentage' : 'Discount amount (₹)'}
                    htmlFor="discountValue"
                    required
                    error={errors.discountValue?.message}
                  >
                    <Input id="discountValue" type="number" step="0.01" min="0" {...register('discountValue')} />
                  </FormField>
                  {discountType === 'percentage' && (
                    <FormField label="Max discount amount (₹)" htmlFor="maxDiscountAmount" description="Caps the rupee value" error={errors.maxDiscountAmount?.message}>
                      <Input id="maxDiscountAmount" type="number" step="0.01" min="0" placeholder="No cap" {...register('maxDiscountAmount')} />
                    </FormField>
                  )}
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Minimum order value (₹)" htmlFor="minOrderValue" error={errors.minOrderValue?.message}>
                  <Input id="minOrderValue" type="number" step="0.01" min="0" placeholder="No minimum" {...register('minOrderValue')} />
                </FormField>
                <FormField label="Maximum cart value (₹)" htmlFor="maximumCartValue" description="Coupon stops applying above this" error={errors.maximumCartValue?.message}>
                  <Input id="maximumCartValue" type="number" step="0.01" min="0" placeholder="No maximum" {...register('maximumCartValue')} />
                </FormField>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scope">
            <div className="max-h-[55vh] overflow-y-auto pr-1">
              <Controller name="scope" control={control} render={({ field }) => <CouponScopeBuilder scope={field.value} onChange={field.onChange} />} />
            </div>
          </TabsContent>

          <TabsContent value="eligibility">
            <div className="max-h-[55vh] overflow-y-auto pr-1">
              <Controller
                name="eligibility"
                control={control}
                render={({ field }) => <CouponEligibilityBuilder eligibility={field.value} onChange={field.onChange} />}
              />
            </div>
          </TabsContent>

          <TabsContent value="limits">
            <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Total usage limit" htmlFor="usageLimit" description="Across all customers" error={errors.usageLimit?.message}>
                  <Input id="usageLimit" type="number" min="1" placeholder="Unlimited" {...register('usageLimit')} />
                </FormField>
                <FormField label="Uses per customer" htmlFor="usageLimitPerCustomer" error={errors.usageLimitPerCustomer?.message}>
                  <Input id="usageLimitPerCustomer" type="number" min="1" {...register('usageLimitPerCustomer')} />
                </FormField>
              </div>
              <FormField label="Daily usage limit" htmlFor="dailyUsageLimit" description="Across all customers, resets every UTC day" error={errors.dailyUsageLimit?.message}>
                <Input id="dailyUsageLimit" type="number" min="1" placeholder="Unlimited" {...register('dailyUsageLimit')} />
              </FormField>

              <Separator />

              <FormField label="On order cancellation / refund" htmlFor="cancellationPolicy">
                <Controller
                  name="cancellationPolicy"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="cancellationPolicy" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CANCELLATION_POLICIES.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <label className="flex items-center gap-2 text-sm">
                <Controller name="stackable" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                Stackable with other coupons (not yet supported at checkout - one coupon per order today)
              </label>
            </div>
          </TabsContent>
        </Tabs>
      </form>
      )}
    </Modal>
  );
}
