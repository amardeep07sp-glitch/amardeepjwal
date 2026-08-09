import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { EmptyState } from '@/components/global/EmptyState';
import { PageLoader } from '@/components/global/Loading';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from './tagsApi';

const EMPTY_FORM = { name: '', color: '#64748b' };

export default function TagManagerPage() {
  const [modalState, setModalState] = useState({ open: false, tag: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagToDelete, setTagToDelete] = useState(null);

  const { data: tags, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalState({ open: true, tag: null });
  };

  const openEdit = (tag) => {
    setForm({ name: tag.name, color: tag.color });
    setModalState({ open: true, tag });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      if (modalState.tag) {
        await updateTag.mutateAsync({ id: modalState.tag.id, ...form });
        toast.success('Tag updated');
      } else {
        await createTag.mutateAsync(form);
        toast.success('Tag created');
      }
      setModalState({ open: false, tag: null });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTag.mutateAsync(tagToDelete.id);
      toast.success('Tag deleted');
      setTagToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading tags..." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Customer Tags</h1>
          <p className="text-sm text-muted-foreground">Lightweight labels for quick filtering (VIP, High Value, Frequent Buyer...).</p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> New tag
        </Button>
      </div>

      {!tags || tags.length === 0 ? (
        <EmptyState title="No tags yet" description="Create your first customer tag." />
      ) : (
        <ul className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-full border border-border py-1 pl-3 pr-1">
              <Badge style={{ backgroundColor: t.color, color: '#fff' }}>{t.name}</Badge>
              <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(t)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setTagToDelete(t)}>
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalState.open}
        onOpenChange={(open) => setModalState({ open, tag: open ? modalState.tag : null })}
        title={modalState.tag ? 'Edit tag' : 'New tag'}
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalState({ open: false, tag: null })}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createTag.isPending || updateTag.isPending}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </FormField>
          <FormField label="Color">
            <Input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} className="h-10 w-20" />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(tagToDelete)}
        onOpenChange={(open) => !open && setTagToDelete(null)}
        title="Delete this tag?"
        description={`"${tagToDelete?.name}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteTag.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
