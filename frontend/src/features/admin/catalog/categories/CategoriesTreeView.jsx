import { useState } from 'react';
import { ChevronRight, ChevronDown, Pencil, Trash2, Copy, Eye, GripVertical, Star, GitMerge } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { EmptyState } from '@/components/global/EmptyState';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { cn } from '@/lib/utils';
import {
  useCategoryTree,
  useDeleteCategory,
  useReorderCategories,
  useDuplicateCategory,
} from './categoriesApi';
import { STATUS_BADGE_VARIANTS } from './categoryStatusMeta';
import { MergeCategoryDialog } from './MergeCategoryDialog';

function TreeNode({ node, depth, dragOverId, setDragOverId, onDrop, onEdit, onPreview, onDuplicate, onMerge, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', node.id)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverId(node.id);
        }}
        onDragLeave={() => setDragOverId((current) => (current === node.id ? null : current))}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverId(null);
          const draggedId = e.dataTransfer.getData('text/plain');
          onDrop(draggedId, node);
        }}
        style={{ paddingLeft: `${depth * 24}px` }}
        className={cn(
          'group flex items-center gap-1.5 rounded-lg py-1.5 pr-2 transition-colors',
          dragOverId === node.id ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-muted'
        )}
      >
        <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn('flex size-5 shrink-0 items-center justify-center', !hasChildren && 'invisible')}
        >
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        <span className="flex flex-1 items-center gap-2 truncate text-sm">
          {node.name}
          {node.isFeatured && <Star className="size-3.5 shrink-0 fill-warning text-warning" />}
          <Badge variant={STATUS_BADGE_VARIANTS[node.status]} className="shrink-0 capitalize">
            {node.status}
          </Badge>
          <span className="shrink-0 text-xs text-muted-foreground">
            {node.productCountRecursive ?? node.productCount ?? 0} products
          </span>
        </span>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <Button variant="ghost" size="icon-sm" aria-label={`Preview ${node.name}`} onClick={() => onPreview(node)}>
            <Eye className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${node.name}`} onClick={() => onEdit(node)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Duplicate ${node.name}`} onClick={() => onDuplicate(node)}>
            <Copy className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Merge ${node.name}`} onClick={() => onMerge(node)}>
            <GitMerge className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${node.name}`} onClick={() => onDelete(node)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              dragOverId={dragOverId}
              setDragOverId={setDragOverId}
              onDrop={onDrop}
              onEdit={onEdit}
              onPreview={onPreview}
              onDuplicate={onDuplicate}
              onMerge={onMerge}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoriesTreeView({ onEdit, onPreview }) {
  const { data: tree = [], isLoading, error, refetch } = useCategoryTree();
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryToMerge, setCategoryToMerge] = useState(null);

  const reorderCategories = useReorderCategories();
  const duplicateCategory = useDuplicateCategory();
  const deleteCategory = useDeleteCategory();

  const handleDropOnNode = async (draggedId, targetNode) => {
    if (!draggedId || draggedId === targetNode.id) return;
    try {
      await reorderCategories.mutateAsync([
        { id: draggedId, parent: targetNode.id, order: targetNode.children?.length ?? 0 },
      ]);
      toast.success(`Moved into "${targetNode.name}"`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDropOnRoot = async (e) => {
    e.preventDefault();
    setDragOverRoot(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;
    try {
      await reorderCategories.mutateAsync([{ id: draggedId, parent: null, order: tree.length }]);
      toast.success('Moved to top level');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDuplicate = async (node) => {
    try {
      await duplicateCategory.mutateAsync(node.id);
      toast.success(`Duplicated "${node.name}"`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast.success('Category moved to trash');
      setCategoryToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading category tree..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Drag a category onto another to nest it underneath. Drag it onto the drop zone below to move it to the top
        level.
      </p>

      <div className="rounded-lg border border-border p-2">
        {tree.length === 0 ? (
          <EmptyState title="No categories yet" description="Switch to Table view to create your first category." />
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              dragOverId={dragOverId}
              setDragOverId={setDragOverId}
              onDrop={handleDropOnNode}
              onEdit={onEdit}
              onPreview={onPreview}
              onDuplicate={handleDuplicate}
              onMerge={setCategoryToMerge}
              onDelete={setCategoryToDelete}
            />
          ))
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverRoot(true);
        }}
        onDragLeave={() => setDragOverRoot(false)}
        onDrop={handleDropOnRoot}
        className={cn(
          'rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground',
          dragOverRoot && 'border-primary bg-primary/10 text-foreground'
        )}
      >
        Drop here to move to top level
      </div>

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Move this category to trash?"
        description={`"${categoryToDelete?.name}" will be moved to trash and can be restored later. Categories with subcategories or assigned products can't be deleted.`}
        confirmLabel="Move to trash"
        variant="destructive"
        isLoading={deleteCategory.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <MergeCategoryDialog
        open={Boolean(categoryToMerge)}
        onOpenChange={(open) => !open && setCategoryToMerge(null)}
        sourceCategory={categoryToMerge}
      />
    </div>
  );
}
