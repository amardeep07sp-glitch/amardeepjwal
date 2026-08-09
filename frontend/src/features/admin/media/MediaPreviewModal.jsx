import { Modal } from '@/components/global/Modal';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/global/Loading';
import { useMediaDetails } from './mediaApi';
import { MEDIA_STATUS_BADGE_VARIANTS, MEDIA_VISIBILITY_BADGE_VARIANTS, formatBytes } from './mediaSchema';

export function MediaPreviewModal({ media, open, onOpenChange }) {
  const { data: details, isLoading: isLoadingDetails } = useMediaDetails(open ? media?.id : undefined);

  if (!media) return null;

  const isVideo = media.type === 'video';

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={media.cloudinary.originalFilename} className="sm:max-w-3xl">
      <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex max-h-[60vh] items-center justify-center overflow-hidden rounded-card bg-black/5">
          {isVideo ? (
            <video src={media.cloudinary.secureUrl} controls className="max-h-[60vh] w-full" />
          ) : (
            <img
              src={media.cloudinary.secureUrl}
              alt={media.altText || media.cloudinary.originalFilename}
              className="max-h-[60vh] w-full object-contain"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={MEDIA_STATUS_BADGE_VARIANTS[media.status]} className="capitalize">
            {media.status}
          </Badge>
          <Badge variant={MEDIA_VISIBILITY_BADGE_VARIANTS[media.visibility]} className="capitalize">
            {media.visibility}
          </Badge>
          {media.isFeatured && <Badge variant="warning">Featured Image</Badge>}
          {media.isFeaturedVideo && <Badge variant="info">Featured Video</Badge>}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
          {media.cloudinary.width && media.cloudinary.height && (
            <div>
              <dt className="text-xs text-muted-foreground">Dimensions</dt>
              <dd>{media.cloudinary.width}×{media.cloudinary.height}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted-foreground">Size</dt>
            <dd>{formatBytes(media.cloudinary.bytes)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Format</dt>
            <dd className="uppercase">{media.cloudinary.format}</dd>
          </div>
          {media.cloudinary.duration && (
            <div>
              <dt className="text-xs text-muted-foreground">Duration</dt>
              <dd>{Math.round(media.cloudinary.duration)}s</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted-foreground">Sort Order</dt>
            <dd>{media.sortOrder}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Uploaded</dt>
            <dd>{new Date(media.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Uploaded By</dt>
            <dd>{isLoadingDetails ? <Spinner className="size-3.5" /> : (details?.createdBy?.name ?? '—')}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Entity Type</dt>
            <dd className="capitalize">{media.entityType}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Folder</dt>
            <dd>{media.cloudinary.folder}</dd>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-xs text-muted-foreground">Cloudinary Public ID</dt>
            <dd className="truncate font-mono text-xs">{media.cloudinary.publicId}</dd>
          </div>
        </dl>

        <div>
          <p className="text-xs text-muted-foreground">
            Usage Count: {isLoadingDetails ? <Spinner className="ml-1 inline size-3" /> : (details?.usageCount ?? 0)}
          </p>
          {details?.usedIn?.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {details.usedIn.map((entry, index) => (
                <li key={`${entry.module}-${entry.entityId}-${index}`} className="text-sm">
                  {entry.module}
                  {entry.entityName ? ` — ${entry.entityName}` : ''}
                </li>
              ))}
            </ul>
          )}
          {!isLoadingDetails && details?.usageCount === 0 && (
            <p className="mt-1 text-sm text-muted-foreground">Not currently used anywhere.</p>
          )}
        </div>

        {media.altText && (
          <div>
            <p className="text-xs text-muted-foreground">Alt Text</p>
            <p className="text-sm">{media.altText}</p>
          </div>
        )}

        {media.caption && (
          <div>
            <p className="text-xs text-muted-foreground">Caption</p>
            <p className="text-sm">{media.caption}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
