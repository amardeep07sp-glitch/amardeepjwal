import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { EmptyState } from '@/components/global/EmptyState';
import { PageLoader } from '@/components/global/Loading';
import { useSegments, useCreateSegment, useUpdateSegment, useDeleteSegment } from './segmentsApi';

const EMPTY_FORM = { name: '', description: '', color: '#6366f1' };

export default function SegmentManagerPage() {
  const [modalState, setModalState] = useState({ open: false, segment: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [segmentToDelete, setSegmentToDelete] = useState(null);

  const { data: segments, isLoading } = useSegments();
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalState({ open: true, segment: null });
  };

  const openEdit = (segment) => {
    setForm({ name: segment.name, description: segment.description, color: segment.color });
    setModalState({ open: true, segment });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      if (modalState.segment) {
        await updateSegment.mutateAsync({ id: modalState.segment.id, ...form });
        toast.success('Segment updated');
      } else {
        await createSegment.mutateAsync(form);
        toast.success('Segment created');
      }
      setModalState({ open: false, segment: null });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSegment.mutateAsync(segmentToDelete.id);
      toast.success('Segment deleted');
      setSegmentToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading segments..." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Customer Segments</h1>
          <p className="text-sm text-muted-foreground">Group customers for targeted service and reporting.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> New segment
        </Button>
      </div>

      {!segments || segments.length === 0 ? (
        <EmptyState title="No segments yet" description="Create your first customer segment." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <Badge style={{ backgroundColor: s.color, color: '#fff' }}>{s.name}</Badge>
                {s.isSystemDefined && <span className="text-xs text-muted-foreground">System</span>}
              </div>
              <p className="text-sm text-muted-foreground">{s.description || 'No description'}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(s)}>
                  <Pencil className="size-4" />
                </Button>
                {!s.isSystemDefined && (
                  <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setSegmentToDelete(s)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalState.open}
        onOpenChange={(open) => setModalState({ open, segment: open ? modalState.segment : null })}
        title={modalState.segment ? 'Edit segment' : 'New segment'}
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalState({ open: false, segment: null })}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createSegment.isPending || updateSegment.isPending}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </FormField>
          <FormField label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </FormField>
          <FormField label="Color">
            <Input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} className="h-10 w-20" />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(segmentToDelete)}
        onOpenChange={(open) => !open && setSegmentToDelete(null)}
        title="Delete this segment?"
        description={`"${segmentToDelete?.name}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteSegment.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
