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
import { useCreateHelpArticle, useUpdateHelpArticle } from './helpApi';
import { helpArticleSchema, helpArticleFormDefaults, HELP_CATEGORIES, HELP_ARTICLE_STATUSES } from './helpSchema';

export function HelpArticleFormModal({ open, onOpenChange, article }) {
  const isEditMode = Boolean(article);
  const createArticle = useCreateHelpArticle();
  const updateArticle = useUpdateHelpArticle();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(helpArticleSchema), defaultValues: helpArticleFormDefaults });

  useEffect(() => {
    if (!open) return;
    reset(article ? { ...helpArticleFormDefaults, ...article } : helpArticleFormDefaults);
  }, [open, article, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEditMode) {
        await updateArticle.mutateAsync({ id: article.id, payload: values });
        toast.success('Help article updated successfully');
      } else {
        await createArticle.mutateAsync(values);
        toast.success('Help article created successfully');
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
      title={isEditMode ? 'Edit help article' : 'New help article'}
      className="sm:max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="help-article-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save article'}
          </Button>
        </>
      }
    >
      <form id="help-article-form" onSubmit={handleSubmit(onSubmit)} className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
          <Input id="title" placeholder="How are making charges calculated?" {...register('title')} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Category" htmlFor="category" required>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HELP_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
                    {HELP_ARTICLE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>

        <FormField label="Summary" htmlFor="summary" description="Shown in article lists and search results">
          <Textarea id="summary" rows={2} placeholder="A one-line summary of this article" {...register('summary')} />
        </FormField>

        <FormField label="Content" htmlFor="content" required error={errors.content?.message}>
          <Textarea id="content" rows={10} placeholder="The full article body" {...register('content')} />
        </FormField>

        <FormField label="Tags" htmlFor="tags" description="Comma-separated, used for search">
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Input
                id="tags"
                placeholder="gold, purity, pricing"
                defaultValue={(field.value ?? []).join(', ')}
                onBlur={(e) => field.onChange(e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
              />
            )}
          />
        </FormField>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Display order" htmlFor="displayOrder">
            <Input id="displayOrder" type="number" step="1" {...register('displayOrder')} />
          </FormField>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <Controller name="featured" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            Featured
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="SEO title" htmlFor="seoTitle">
            <Input id="seoTitle" {...register('seoTitle')} />
          </FormField>
          <FormField label="SEO description" htmlFor="seoDescription">
            <Input id="seoDescription" {...register('seoDescription')} />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
