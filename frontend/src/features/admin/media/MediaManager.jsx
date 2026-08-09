import { MediaUploadArea } from './MediaUploadArea';
import { MediaGrid } from './MediaGrid';

export function MediaManager({ entityType, entityId, variantId }) {
  if (!entityId) {
    return (
      <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Save this item first to start uploading media.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <MediaUploadArea entityType={entityType} entityId={entityId} variantId={variantId} />
      <MediaGrid entityType={entityType} entityId={entityId} variantId={variantId} />
    </div>
  );
}
