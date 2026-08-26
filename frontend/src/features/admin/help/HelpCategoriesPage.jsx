import { useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useHelpCategoriesAdmin, useUpdateHelpCategory } from './helpApi';

// `code` (the enum ContextualHelp keys off) is never editable here - only
// the display metadata is (see helpCategory.model.js's own header comment
// for why). One row = one pending edit, saved individually so a half-typed
// edit on one category never blocks saving another.
function CategoryRow({ category }) {
  const updateCategory = useUpdateHelpCategory();
  const [form, setForm] = useState({
    label: category.label,
    description: category.description ?? '',
    icon: category.icon ?? '',
    displayOrder: category.displayOrder ?? 0,
    active: category.active,
  });
  const [dirty, setDirty] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateCategory.mutateAsync({ code: category.code, payload: form });
      setDirty(false);
      toast.success(`"${form.label}" saved`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="grid grid-cols-[140px_1fr_1fr_90px_90px_100px] items-center gap-3 border-b border-border py-3 last:border-0">
      <span className="text-xs font-mono text-muted-foreground">{category.code}</span>
      <Input value={form.label} onChange={(e) => update('label', e.target.value)} placeholder="Label" />
      <Input value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Description (optional)" />
      <Input value={form.icon} onChange={(e) => update('icon', e.target.value)} placeholder="Icon" />
      <Input
        type="number"
        value={form.displayOrder}
        onChange={(e) => update('displayOrder', Number(e.target.value) || 0)}
      />
      <div className="flex items-center gap-2">
        <Switch checked={form.active} onCheckedChange={(v) => update('active', v)} />
        {dirty && (
          <Button type="button" size="sm" variant="outline" onClick={handleSave} loading={updateCategory.isPending}>
            Save
          </Button>
        )}
      </div>
    </div>
  );
}

export default function HelpCategoriesPage() {
  const { data: categories, isLoading, error, refetch } = useHelpCategoriesAdmin();

  if (isLoading) return <PageLoader label="Loading categories..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Help Categories</h1>
        <p className="text-sm text-muted-foreground">
          Rename, reorder, or hide the fixed set of Help Center categories. The category codes themselves stay fixed - they're what
          Contextual Help buttons key off across the storefront.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-[140px_1fr_1fr_90px_90px_100px] gap-3 border-b border-border pb-2 text-xs font-medium text-muted-foreground">
            <span>Code</span>
            <span>Label</span>
            <span>Description</span>
            <span>Icon</span>
            <span>Order</span>
            <span>Active</span>
          </div>
          {(categories ?? []).map((category) => (
            <CategoryRow key={category.code} category={category} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
