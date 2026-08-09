import { useState } from 'react';
import { toast } from 'sonner';

import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategoryTree, useMergeCategory } from './categoriesApi';
import { flattenTreeForParentOptions } from './categoryTreeOptions';

// Folds `sourceCategory` into another category: its products and direct
// subcategories move to the target, and the source itself is moved to
// trash (restorable, see category.service.js#mergeCategories on the backend).
export function MergeCategoryDialog({ open, onOpenChange, sourceCategory }) {
  const [targetId, setTargetId] = useState('');
  const { data: tree = [] } = useCategoryTree();
  const mergeCategory = useMergeCategory();

  // Excludes the source itself and its whole subtree - merging into a
  // descendant would create a cycle, and the backend rejects it too.
  const targetOptions = flattenTreeForParentOptions(tree, sourceCategory?.id);

  const handleClose = (nextOpen) => {
    if (!nextOpen) setTargetId('');
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (!targetId) {
      toast.error('Pick a category to merge into');
      return;
    }
    try {
      await mergeCategory.mutateAsync({ sourceId: sourceCategory.id, targetId });
      toast.success(`"${sourceCategory.name}" merged into the selected category`);
      handleClose(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!sourceCategory) return null;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={`Merge "${sourceCategory.name}"`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={mergeCategory.isPending}>
            {mergeCategory.isPending ? 'Merging...' : 'Merge'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-sm text-muted-foreground">
          Every product and direct subcategory of "{sourceCategory.name}" moves to the category you pick below.
          "{sourceCategory.name}" is then moved to trash.
        </p>

        <FormField label="Merge into" htmlFor="merge-target">
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger id="merge-target" className="w-full">
              <SelectValue placeholder="Select a target category" />
            </SelectTrigger>
            <SelectContent>
              {targetOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {'—'.repeat(option.depth)} {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </Modal>
  );
}
