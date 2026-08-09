import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/global/FormField';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useProductPricing, useUpdateProductPricing } from './pricingApi';
import { calculatePricePreview } from './priceCalculator';
import { formatCurrency } from './formatCurrency';
import { pricingSchema, pricingFormDefaults, DISCOUNT_TYPES, PRICE_STATUSES } from './pricingSchema';
import { PriceHistoryTimeline } from './PriceHistoryTimeline';

function SectionLabel({ children }) {
  return <p className="text-sm font-medium text-heading">{children}</p>;
}

function PreviewRow({ label, value, emphasis }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={emphasis ? 'text-base font-semibold text-heading' : 'text-sm text-foreground'}>{value}</span>
    </div>
  );
}

export function PricingTabContent({ productId }) {
  const { data: pricing, isLoading, error, refetch } = useProductPricing(productId);
  const updatePricing = useUpdateProductPricing();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(pricingSchema), defaultValues: pricingFormDefaults });

  useEffect(() => {
    if (pricing) {
      reset({ ...pricingFormDefaults, ...pricing, reason: '' });
    }
  }, [pricing, reset]);

  const watched = watch();
  const livePreview = calculatePricePreview(watched);

  const onSubmit = async (values) => {
    try {
      await updatePricing.mutateAsync({ productId, payload: values });
      toast.success('Pricing updated successfully');
      reset({ ...values, reason: '' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading pricing..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Price preview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <PreviewRow label="MRP" value={formatCurrency(livePreview.mrp, watched.currency)} />
          <PreviewRow label="Discount" value={`- ${formatCurrency(livePreview.discountAmount, watched.currency)}`} />
          <PreviewRow label="Tax" value={formatCurrency(livePreview.taxAmount, watched.currency)} />
          <Separator />
          <PreviewRow label="Final price" value={formatCurrency(livePreview.finalPrice, watched.currency)} emphasis />
          <PreviewRow
            label="Customer savings"
            value={formatCurrency(livePreview.savings, watched.currency)}
          />
        </CardContent>
      </Card>

      <SectionLabel>Base pricing</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Cost price" htmlFor="costPrice" required error={errors.costPrice?.message}>
          <Input id="costPrice" type="number" step="0.01" {...register('costPrice')} />
        </FormField>
        <FormField label="Selling price" htmlFor="sellingPrice" required error={errors.sellingPrice?.message}>
          <Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} />
        </FormField>
        <FormField label="MRP" htmlFor="mrp" required error={errors.mrp?.message}>
          <Input id="mrp" type="number" step="0.01" {...register('mrp')} />
        </FormField>
        <FormField label="Currency" htmlFor="currency" required error={errors.currency?.message}>
          <Input id="currency" {...register('currency')} />
        </FormField>
      </div>

      <SectionLabel>Discount calculator</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Discount type" htmlFor="discountType">
          <Controller
            name="discountType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="discountType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Discount value" htmlFor="discountValue" error={errors.discountValue?.message}>
          <Input id="discountValue" type="number" step="0.01" {...register('discountValue')} />
        </FormField>
      </div>

      <SectionLabel>Tax</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tax percentage" htmlFor="taxPercentage" error={errors.taxPercentage?.message}>
          <Input id="taxPercentage" type="number" step="0.01" {...register('taxPercentage')} />
        </FormField>
        <FormField label="Tax already included in MRP">
          <Controller
            name="taxIncluded"
            control={control}
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </FormField>
      </div>

      <FormField label="Price status" htmlFor="priceStatus">
        <Controller
          name="priceStatus"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="priceStatus" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <Separator />
      <SectionLabel>Jewellery details</SectionLabel>
      <p className="text-xs text-muted-foreground">
        Captured for future gold-rate-based pricing. Not yet factored into the final price above.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Making charges" htmlFor="makingCharges">
          <Input id="makingCharges" type="number" step="0.01" {...register('makingCharges')} />
        </FormField>
        <FormField label="Making charge type" htmlFor="makingChargeType">
          <Controller
            name="makingChargeType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="makingChargeType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Wastage %" htmlFor="wastagePercentage">
          <Input id="wastagePercentage" type="number" step="0.01" {...register('wastagePercentage')} />
        </FormField>
        <FormField label="Gold rate snapshot" htmlFor="goldRateSnapshot" description="Per gram">
          <Input id="goldRateSnapshot" type="number" step="0.01" {...register('goldRateSnapshot')} />
        </FormField>
        <FormField label="Silver rate snapshot" htmlFor="silverRateSnapshot" description="Per gram">
          <Input id="silverRateSnapshot" type="number" step="0.01" {...register('silverRateSnapshot')} />
        </FormField>
        <FormField label="Stone cost" htmlFor="stoneCost">
          <Input id="stoneCost" type="number" step="0.01" {...register('stoneCost')} />
        </FormField>
        <FormField label="Diamond cost" htmlFor="diamondCost">
          <Input id="diamondCost" type="number" step="0.01" {...register('diamondCost')} />
        </FormField>
        <FormField label="Labour cost" htmlFor="labourCost">
          <Input id="labourCost" type="number" step="0.01" {...register('labourCost')} />
        </FormField>
      </div>

      <Separator />
      <FormField label="Reason for this change" htmlFor="reason" description="Recorded in the price history">
        <Input id="reason" placeholder="e.g. Gold rate revision" {...register('reason')} />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Saving...' : 'Save pricing'}
      </Button>

      <Separator />
      <SectionLabel>Price history</SectionLabel>
      <PriceHistoryTimeline productId={productId} currency={watched.currency} />
    </form>
  );
}
