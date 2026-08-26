import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, Trash2, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/compressImage';
import { EmptyState } from '@/components/global/EmptyState';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { useAuthStore } from '@/store/authStore';
import { MediaCard } from './MediaCard';
import { MediaPreviewModal } from './MediaPreviewModal';
import { MediaMetadataEditor } from './MediaMetadataEditor';
import {
  useMedia,
  useDeleteMedia,
  useReplaceMedia,
  useBulkDeleteMedia,
  useBulkArchiveMedia,
  useBulkRestoreMedia,
  useReorderMedia,
} from './mediaApi';

const CONFLICT_STATUS = 409;

export function MediaGrid({ entityType, entityId, variantId }) {
  const { data, isLoading, error, refetch } = useMedia(entityType, entityId, variantId);
  const items = data?.items ?? [];

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewMedia, setPreviewMedia] = useState(null);
  const [editMedia, setEditMedia] = useState(null);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  // Set when a delete is blocked with 409 (media still in use) - offers a
  // Force Delete follow-up, but only ever rendered for a super admin.
  const [deleteConflict, setDeleteConflict] = useState(null);
  const replaceTargetId = useRef(null);
  const replaceInputRef = useRef(null);

  const isSuperAdmin = useAuthStore((state) => state.user?.role === 'super_admin');

  const deleteMedia = useDeleteMedia(entityType, entityId, variantId);
  const replaceMedia = useReplaceMedia(entityType, entityId, variantId);
  const bulkDeleteMedia = useBulkDeleteMedia(entityType, entityId, variantId);
  const bulkArchiveMedia = useBulkArchiveMedia(entityType, entityId, variantId);
  const bulkRestoreMedia = useBulkRestoreMedia(entityType, entityId, variantId);
  const reorderMedia = useReorderMedia(entityType, entityId, variantId);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleReplaceClick = (media) => {
    replaceTargetId.current = media.id;
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !replaceTargetId.current) return;

    const formData = new FormData();
    formData.append('file', await compressImage(file));

    try {
      await replaceMedia.mutateAsync({ id: replaceTargetId.current, formData });
      toast.success('Media replaced successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      replaceTargetId.current = null;
    }
  };

  const handleDeleteConfirm = async () => {
    const target = mediaToDelete;
    try {
      await deleteMedia.mutateAsync({ id: target.id });
      toast.success('Media deleted successfully');
      setMediaToDelete(null);
    } catch (err) {
      if (err.statusCode === CONFLICT_STATUS) {
        setMediaToDelete(null);
        setDeleteConflict({ kind: 'single', id: target.id, message: err.message });
      } else {
        toast.error(err.message);
      }
    }
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    try {
      await bulkDeleteMedia.mutateAsync({ ids });
      toast.success('Selected media deleted');
      clearSelection();
      setBulkDeleteOpen(false);
    } catch (err) {
      if (err.statusCode === CONFLICT_STATUS) {
        setBulkDeleteOpen(false);
        setDeleteConflict({ kind: 'bulk', ids, message: err.message });
      } else {
        toast.error(err.message);
      }
    }
  };

  const handleForceDeleteConfirm = async () => {
    try {
      if (deleteConflict.kind === 'single') {
        await deleteMedia.mutateAsync({ id: deleteConflict.id, force: true });
      } else {
        await bulkDeleteMedia.mutateAsync({ ids: deleteConflict.ids, force: true });
        clearSelection();
      }
      toast.success('Media force deleted');
      setDeleteConflict(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkArchive = async () => {
    try {
      await bulkArchiveMedia.mutateAsync(Array.from(selectedIds));
      toast.success('Selected media archived');
      clearSelection();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkRestore = async () => {
    try {
      await bulkRestoreMedia.mutateAsync(Array.from(selectedIds));
      toast.success('Selected media restored');
      clearSelection();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDrop = async (draggedId, targetMedia) => {
    setDragOverId(null);
    if (!draggedId || draggedId === targetMedia.id) return;

    const reordered = [...items];
    const fromIndex = reordered.findIndex((m) => m.id === draggedId);
    const toIndex = reordered.findIndex((m) => m.id === targetMedia.id);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    try {
      await reorderMedia.mutateAsync(reordered.map((m, index) => ({ id: m.id, sortOrder: index })));
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading media..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <div className="flex flex-col gap-3">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-card border border-border bg-muted/40 px-3 py-2">
          <p className="text-sm text-muted-foreground">{selectedIds.size} selected</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkArchive}>
              <Archive className="size-3.5" />
              Archive
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkRestore}>
              <ArchiveRestore className="size-3.5" />
              Restore
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No media yet"
          description="Upload images or videos using the area above."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((media) => (
            <div
              key={media.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', media.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(media.id);
              }}
              onDragLeave={() => setDragOverId((current) => (current === media.id ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                handleDrop(draggedId, media);
              }}
            >
              <MediaCard
                media={media}
                selected={selectedIds.has(media.id)}
                onToggleSelect={toggleSelect}
                onPreview={setPreviewMedia}
                onEdit={setEditMedia}
                onReplace={handleReplaceClick}
                onDelete={setMediaToDelete}
                isDragOver={dragOverId === media.id}
              />
            </div>
          ))}
        </div>
      )}

      <input ref={replaceInputRef} type="file" className="hidden" onChange={handleReplaceFileChosen} />

      <MediaPreviewModal media={previewMedia} open={Boolean(previewMedia)} onOpenChange={(open) => !open && setPreviewMedia(null)} />

      <MediaMetadataEditor
        media={editMedia}
        open={Boolean(editMedia)}
        onOpenChange={(open) => !open && setEditMedia(null)}
        entityType={entityType}
        entityId={entityId}
        variantId={variantId}
      />

      <ConfirmDialog
        open={Boolean(mediaToDelete)}
        onOpenChange={(open) => !open && setMediaToDelete(null)}
        title="Delete this media?"
        description={`"${mediaToDelete?.cloudinary?.originalFilename}" will be permanently removed from storage.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMedia.isPending}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.size} media item(s)?`}
        description="This will permanently remove the selected files from storage."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={bulkDeleteMedia.isPending}
        onConfirm={handleBulkDeleteConfirm}
      />

      <ConfirmDialog
        open={Boolean(deleteConflict)}
        onOpenChange={(open) => !open && setDeleteConflict(null)}
        title="This media is currently being used"
        description={`${deleteConflict?.message ?? ''} Please remove all references before deleting${
          isSuperAdmin ? ', or force delete anyway as a super admin.' : '.'
        }`}
        confirmLabel={isSuperAdmin ? 'Force Delete' : 'OK'}
        variant="destructive"
        isLoading={deleteMedia.isPending || bulkDeleteMedia.isPending}
        onConfirm={isSuperAdmin ? handleForceDeleteConfirm : () => setDeleteConflict(null)}
      />
    </div>
  );
}
