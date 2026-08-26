import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCampaign, useUpdateCampaign } from './campaignsApi';
import { campaignSchema, campaignFormDefaults, CAMPAIGN_TYPES } from './campaignSchema';

// A date input needs "YYYY-MM-DD" - same shortening CouponFormModal /
// CollectionFormModal already use for their own date fields.
function toDateInputValue(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toISOString().slice(0, 10);
}

export function CampaignFormModal({ open, onOpenChange, campaign }) {
  const isEditMode = Boolean(campaign);
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(campaignSchema), defaultValues: campaignFormDefaults });

  useEffect(() => {
    if (open) {
      reset(
        campaign
          ? {
              ...campaignFormDefaults,
              ...campaign,
              budget: campaign.budget ?? '',
              startAt: toDateInputValue(campaign.startAt),
              endAt: toDateInputValue(campaign.endAt),
              tags: campaign.tags ?? [],
            }
          : campaignFormDefaults
      );
    }
  }, [open, campaign, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateCampaign.mutateAsync({ id: campaign.id, payload: values });
        toast.success('Campaign updated successfully');
      } else {
        await createCampaign.mutateAsync(values);
        toast.success('Campaign created successfully');
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
      title={isEditMode ? 'Edit campaign' : 'New campaign'}
      className="sm:max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="campaign-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save campaign'}
          </Button>
        </>
      }
    >
      <form id="campaign-form" onSubmit={handleSubmit(onSubmit)} className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <FormField label="Name" htmlFor="name" required description="e.g. Diwali Jewellery Sale 2026" error={errors.name?.message}>
          <Input id="name" placeholder="Diwali Jewellery Sale 2026" {...register('name')} />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" rows={2} placeholder="Internal note, not shown to customers" {...register('description')} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Campaign type" htmlFor="campaignType" required>
            <Controller
              name="campaignType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="campaignType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Priority" htmlFor="priority" description="Higher runs first when multiple campaigns overlap">
            <Input id="priority" type="number" step="1" {...register('priority')} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Start date" htmlFor="startAt" required error={errors.startAt?.message}>
            <Input id="startAt" type="date" {...register('startAt')} />
          </FormField>
          <FormField label="End date" htmlFor="endAt" required error={errors.endAt?.message}>
            <Input id="endAt" type="date" {...register('endAt')} />
          </FormField>
        </div>

        <FormField label="Budget" htmlFor="budget" description="Total discount rupees this campaign may spend across all its coupons. Leave blank for unlimited." error={errors.budget?.message}>
          <Input id="budget" type="number" step="0.01" min="0" placeholder="Unlimited" {...register('budget')} />
        </FormField>

        <FormField label="Tags" htmlFor="tags" description="Comma-separated, for your own filtering/reporting">
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Input
                id="tags"
                placeholder="festive, gold, wedding"
                defaultValue={(field.value ?? []).join(', ')}
                onBlur={(e) => field.onChange(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
              />
            )}
          />
        </FormField>
      </form>
    </Modal>
  );
}
