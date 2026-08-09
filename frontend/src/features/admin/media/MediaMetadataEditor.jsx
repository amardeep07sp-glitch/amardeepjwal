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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateMediaMetadata } from './mediaApi';
import { metadataSchema, metadataFormDefaults } from './mediaSchema';

export function MediaMetadataEditor({ media, open, onOpenChange, entityType, entityId, variantId }) {
  const updateMetadata = useUpdateMediaMetadata(entityType, entityId, variantId);
  const isVideo = media?.type === 'video';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(metadataSchema), defaultValues: metadataFormDefaults });

  useEffect(() => {
    if (open && media) {
      reset({
        altText: media.altText || '',
        caption: media.caption || '',
        visibility: media.visibility,
        isFeatured: media.isFeatured,
        isFeaturedVideo: media.isFeaturedVideo,
      });
    }
  }, [open, media, reset]);

  const onSubmit = async (values) => {
    try {
      await updateMetadata.mutateAsync({ id: media.id, payload: values });
      toast.success('Media details updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit media details"
      className="sm:max-w-md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="media-metadata-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="media-metadata-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Alt text" htmlFor="altText" description="Describes the media for accessibility & SEO">
          <Input id="altText" {...register('altText')} />
        </FormField>
        <FormField label="Caption" htmlFor="caption">
          <Textarea id="caption" rows={2} {...register('caption')} />
        </FormField>
        <FormField label="Visibility" htmlFor="visibility">
          <Controller
            name="visibility"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="visibility" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField
          label="Set as featured image"
          description={isVideo ? 'Videos cannot be set as the featured image' : 'Only one featured image per item'}
        >
          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isVideo} />
            )}
          />
        </FormField>
        <FormField
          label="Set as featured video"
          description={isVideo ? 'Only one featured video per item' : 'Only videos can be set as the featured video'}
        >
          <Controller
            name="isFeaturedVideo"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!isVideo} />
            )}
          />
        </FormField>
        {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
      </form>
    </Modal>
  );
}
