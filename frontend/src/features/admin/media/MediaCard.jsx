import { Eye, Pencil, RefreshCw, Trash2, Star, GripVertical, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { MEDIA_STATUS_BADGE_VARIANTS, MEDIA_VISIBILITY_BADGE_VARIANTS, formatBytes } from './mediaSchema';

export function MediaCard({
  media,
  selected,
  onToggleSelect,
  onPreview,
  onEdit,
  onReplace,
  onDelete,
  dragHandleProps,
  isDragOver,
}) {
  const isVideo = media.type === 'video';

  return (
    <div
      {...dragHandleProps}
      className={cn(
        'group flex flex-col overflow-hidden rounded-card border border-border bg-card transition-colors',
        isDragOver && 'ring-2 ring-primary'
      )}
    >
      <div className="relative aspect-square bg-muted">
        <button type="button" onClick={() => onPreview(media)} className="block h-full w-full">
          <img
            src={media.cloudinary.thumbnailUrl || media.cloudinary.secureUrl}
            alt={media.altText || media.cloudinary.originalFilename}
            className="h-full w-full object-cover"
          />
        </button>

        {isVideo && (
          <PlayCircle className="pointer-events-none absolute inset-0 m-auto size-8 text-white drop-shadow" />
        )}

        <div className="absolute top-2 left-2">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(media.id)}
            aria-label={`Select ${media.cloudinary.originalFilename}`}
            className="border-white bg-black/30 data-checked:bg-primary"
          />
        </div>

        <div className="absolute top-2 right-2 cursor-grab text-white opacity-0 drop-shadow group-hover:opacity-100">
          <GripVertical className="size-4" />
        </div>

        <div className="absolute bottom-2 left-2 flex gap-1">
          {media.isFeatured && (
            <Badge variant="warning" className="gap-1">
              <Star className="size-3 fill-current" />
              Featured
            </Badge>
          )}
          {media.isFeaturedVideo && (
            <Badge variant="info" className="gap-1">
              <PlayCircle className="size-3 fill-current" />
              Featured Video
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant={MEDIA_STATUS_BADGE_VARIANTS[media.status]} className="capitalize">
            {media.status}
          </Badge>
          <Badge variant={MEDIA_VISIBILITY_BADGE_VARIANTS[media.visibility]} className="capitalize">
            {media.visibility}
          </Badge>
        </div>

        <p className="truncate text-xs text-muted-foreground" title={media.cloudinary.originalFilename}>
          {media.cloudinary.originalFilename || media.cloudinary.filename}
        </p>

        <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {media.cloudinary.width && media.cloudinary.height && (
            <span>
              {media.cloudinary.width}×{media.cloudinary.height}
            </span>
          )}
          <span>{formatBytes(media.cloudinary.bytes)}</span>
          <span className="uppercase">{media.cloudinary.format}</span>
        </div>

        {media.altText && <p className="truncate text-xs text-foreground" title={media.altText}>{media.altText}</p>}

        <div className="mt-1 flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Preview" onClick={() => onPreview(media)}>
            <Eye className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Edit metadata" onClick={() => onEdit(media)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Replace file" onClick={() => onReplace(media)}>
            <RefreshCw className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => onDelete(media)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
