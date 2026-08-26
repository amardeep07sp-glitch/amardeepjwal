import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/global/FormField';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useMetalRates, useUpdateMetalRates } from './metalRatesApi';

const schema = z.object({
  gold24k: z.coerce.number().min(0),
  gold22k: z.coerce.number().min(0),
  gold18k: z.coerce.number().min(0),
  silver: z.coerce.number().min(0),
  unit: z.string().min(1),
});

export default function MetalRatesPage() {
  const { data: rates, isLoading, error, refetch } = useMetalRates();
  const updateRates = useUpdateMetalRates();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { gold24k: 0, gold22k: 0, gold18k: 0, silver: 0, unit: 'per gram' } });

  useEffect(() => {
    if (rates) reset(rates);
  }, [rates, reset]);

  const onSubmit = async (values) => {
    try {
      await updateRates.mutateAsync(values);
      toast.success('Metal rates updated - now live on the storefront');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading metal rates..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Today's Metal Rates</h1>
          <p className="text-sm text-muted-foreground">
            Shown on the storefront's Gold Rate page. There is no live market feed - update these by hand from your real source
            whenever the rate changes.
          </p>
          {rates?.updatedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated {new Date(rates.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Gold 24K (per gram)" htmlFor="gold24k" error={errors.gold24k?.message}>
            <Input id="gold24k" type="number" step="0.01" min="0" {...register('gold24k')} />
          </FormField>
          <FormField label="Gold 22K (per gram)" htmlFor="gold22k" error={errors.gold22k?.message}>
            <Input id="gold22k" type="number" step="0.01" min="0" {...register('gold22k')} />
          </FormField>
          <FormField label="Gold 18K (per gram)" htmlFor="gold18k" error={errors.gold18k?.message}>
            <Input id="gold18k" type="number" step="0.01" min="0" {...register('gold18k')} />
          </FormField>
          <FormField label="Silver (per gram)" htmlFor="silver" error={errors.silver?.message}>
            <Input id="silver" type="number" step="0.01" min="0" {...register('silver')} />
          </FormField>
          <FormField label="Unit label" htmlFor="unit" error={errors.unit?.message}>
            <Input id="unit" {...register('unit')} />
          </FormField>
        </CardContent>
      </Card>
    </form>
  );
}
