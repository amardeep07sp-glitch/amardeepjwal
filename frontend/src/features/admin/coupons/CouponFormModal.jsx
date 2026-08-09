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
import { useCreateCoupon, useUpdateCoupon } from './couponsApi';
import { couponSchema, couponFormDefaults, COUPON_DISCOUNT_TYPES } from './couponSchema';

// A datetime-local input needs "YYYY-MM-DDTHH:mm", not a full ISO string -
// same helper CollectionFormModal.jsx uses for startDate/endDate; the
// reverse conversion is a no-op since the backend's z.coerce.date() parses
// that shortened string exactly the way the native input means it.
function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toISOString().slice(0, 16);
}

export function CouponFormModal({ open, onOpenChange, coupon }) {
  const isEditMode = Boolean(coupon);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(couponSchema), defaultValues: couponFormDefaults });

  useEffect(() => {
    if (open) {
      reset(
        coupon
          ? {
              ...couponFormDefaults,
              ...coupon,
              maxDiscountAmount: coupon.maxDiscountAmount ?? '',
              usageLimit: coupon.usageLimit ?? '',
              validFrom: toDatetimeLocalValue(coupon.validFrom),
              validUntil: toDatetimeLocalValue(coupon.validUntil),
            }
          : couponFormDefaults
      );
    }
  }, [open, coupon, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateCoupon.mutateAsync({ id: coupon.id, payload: values });
        toast.success('Coupon updated successfully');
      } else {
        await createCoupon.mutateAsync(values);
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
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save coupon'}
          </Button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Code" htmlFor="code" required description="Shown to customers, e.g. WELCOME10" error={errors.code?.message}>
            <Input id="code" className="uppercase" placeholder="WELCOME10" {...register('code')} />
          </FormField>
          <FormField label="Status" htmlFor="isActive">
            <div className="flex h-10 items-center">
              <Controller name="isActive" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
              <span className="ml-2 text-sm text-muted-foreground">Active</span>
            </div>
          </FormField>
        </div>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={2} placeholder="Internal note, not shown to customers" {...register('description')} />
        </FormField>

        <Separator />

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
          <FormField label="Discount value" htmlFor="discountValue" required error={errors.discountValue?.message}>
            <Input id="discountValue" type="number" step="0.01" min="0" {...register('discountValue')} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Max discount amount" htmlFor="maxDiscountAmount" description="Caps a % discount's rupee value" error={errors.maxDiscountAmount?.message}>
            <Input id="maxDiscountAmount" type="number" step="0.01" min="0" placeholder="No cap" {...register('maxDiscountAmount')} />
          </FormField>
          <FormField label="Minimum order value" htmlFor="minOrderValue" error={errors.minOrderValue?.message}>
            <Input id="minOrderValue" type="number" step="0.01" min="0" placeholder="No minimum" {...register('minOrderValue')} />
          </FormField>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Total usage limit" htmlFor="usageLimit" description="Across all customers" error={errors.usageLimit?.message}>
            <Input id="usageLimit" type="number" min="1" placeholder="Unlimited" {...register('usageLimit')} />
          </FormField>
          <FormField label="Uses per customer" htmlFor="usageLimitPerCustomer" error={errors.usageLimitPerCustomer?.message}>
            <Input id="usageLimitPerCustomer" type="number" min="1" {...register('usageLimitPerCustomer')} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Valid from" htmlFor="validFrom" required error={errors.validFrom?.message}>
            <Input id="validFrom" type="datetime-local" {...register('validFrom')} />
          </FormField>
          <FormField label="Valid until" htmlFor="validUntil" required error={errors.validUntil?.message}>
            <Input id="validUntil" type="datetime-local" {...register('validUntil')} />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
