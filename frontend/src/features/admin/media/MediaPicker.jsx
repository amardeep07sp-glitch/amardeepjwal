import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Pencil, X, Loader2, UploadCloud, LibraryBig, Video } from 'lucide-react';

import { Modal } from '@/components/global/Modal';
import { SearchInput } from '@/components/global/SearchInput';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/global/EmptyState';
import { PageLoader } from '@/components/global/Loading';
import { cn } from '@/lib/utils';
import { useUploadMedia, useMediaLibrary } from './mediaApi';

// Opt-in via the `mediaType` prop (Collection Engine v2.0's Promo Video
// slot) - every other existing caller never passes it, so ACCEPTED_MIME_TYPES
// stays exactly what it always was for them.
const ACCEPTED_MIME_TYPES_BY_TYPE = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};
const HELPER_TEXT_BY_TYPE = {
  image: 'JPEG, PNG, WEBP, AVIF',
  video: 'MP4, WEBM, MOV',
};

// Normalizes the full serializeMedia shape (returned by /media/upload and
// /media/library, both nested under `cloudinary`) into the same flat
// serializeMediaRef shape every *Media form field stores and receives from
// its own module's API (Brand.logoMedia, Category.bannerMedia, etc.) - so
// the parent form always deals with one consistent shape regardless of
// whether the image came from a fresh upload or the library picker.
const toMediaRefShape = (media) => ({
  _id: media.id,
  secureUrl: media.cloudinary.secureUrl,
  thumbnailUrl: media.cloudinary.thumbnailUrl,
  width: media.cloudinary.width,
  height: media.cloudinary.height,
  format: media.cloudinary.format,
  resourceType: media.cloudinary.resourceType,
  bytes: media.cloudinary.bytes,
  altText: media.altText,
  caption: media.caption,
});

function LibraryGrid({ entityType, mediaType, onSelect }) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useMediaLibrary({ entityType, type: mediaType, search, limit: 24 });
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-3">
      <SearchInput value={search} onChange={setSearch} placeholder="Search media library..." />
      {isLoading ? (
        <PageLoader label="Loading media library..." />
      ) : items.length === 0 ? (
        <EmptyState icon={LibraryBig} title="No media found" description={`Upload a new ${mediaType} instead.`} />
      ) : (
        <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5">
          {items.map((item) =>
            mediaType === 'video' ? (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelect(item)}
                className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-muted transition-colors hover:border-primary"
              >
                <video src={item.cloudinary.secureUrl} className="h-full w-full object-cover" muted />
              </button>
            ) : (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelect(item)}
                className="aspect-square overflow-hidden rounded-lg border border-border transition-colors hover:border-primary"
              >
                <img
                  src={item.cloudinary.thumbnailUrl || item.cloudinary.secureUrl}
                  alt={item.altText || item.cloudinary.originalFilename}
                  className="h-full w-full object-cover"
                />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function MediaPicker({ value, onChange, entityType, entityId, disabled, aspect = 'aspect-square', mediaType = 'image' }) {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState('upload');
  const inputRef = useRef(null);
  const uploadMedia = useUploadMedia(entityType, entityId);
  const acceptedMimeTypes = ACCEPTED_MIME_TYPES_BY_TYPE[mediaType];

  const isDisabled = disabled || !entityId;

  const handleFileChosen = async (file) => {
    if (!file) return;
    if (!acceptedMimeTypes.includes(file.type)) {
      toast.error(`Unsupported format - use ${HELPER_TEXT_BY_TYPE[mediaType]}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    try {
      const response = await uploadMedia.mutateAsync(formData);
      onChange(toMediaRefShape(response.data));
      toast.success(mediaType === 'video' ? 'Video uploaded' : 'Image uploaded');
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLibrarySelect = (media) => {
    onChange(toMediaRefShape(media));
    setOpen(false);
  };

  const PlaceholderIcon = mediaType === 'video' ? Video : ImagePlus;

  if (isDisabled) {
    return (
      <div
        className={cn(
          'flex w-32 flex-col items-center justify-center gap-1 rounded-card border border-dashed border-border p-3 text-center text-xs text-muted-foreground',
          aspect
        )}
      >
        <PlaceholderIcon className="size-5" />
        Save to add {mediaType === 'video' ? 'a video' : 'an image'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className={cn('group relative w-32 overflow-hidden rounded-card border border-border bg-muted', aspect)}>
        {value ? (
          <>
            {mediaType === 'video' ? (
              <video src={value.secureUrl} className="h-full w-full object-cover" muted loop />
            ) : (
              <img src={value.thumbnailUrl || value.secureUrl} alt={value.altText || ''} className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label={`Replace ${mediaType}`}
                onClick={() => {
                  setActiveView('upload');
                  setOpen(true);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                aria-label={`Remove ${mediaType}`}
                onClick={() => onChange(null)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setActiveView('upload');
              setOpen(true);
            }}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <PlaceholderIcon className="size-5" />
            Add {mediaType === 'video' ? 'video' : 'image'}
          </button>
        )}
      </div>

      <Modal open={open} onOpenChange={setOpen} title={`Select ${mediaType}`} className="sm:max-w-lg">
        <div className="flex flex-col gap-4">
          <div className="flex gap-1 rounded-lg border border-border p-1">
            <Button
              type="button"
              variant={activeView === 'upload' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveView('upload')}
            >
              <UploadCloud className="size-3.5" />
              Upload New
            </Button>
            <Button
              type="button"
              variant={activeView === 'library' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveView('library')}
            >
              <LibraryBig className="size-3.5" />
              Media Library
            </Button>
          </div>

          {activeView === 'upload' ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileChosen(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              {uploadMedia.isPending ? (
                <Loader2 className="size-6 animate-spin text-primary" />
              ) : (
                <UploadCloud className="size-6 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">
                {uploadMedia.isPending ? 'Uploading...' : `Drag & drop a ${mediaType}, or click to browse`}
              </p>
              <p className="text-xs text-muted-foreground">{HELPER_TEXT_BY_TYPE[mediaType]}</p>
              <input
                ref={inputRef}
                type="file"
                accept={acceptedMimeTypes.join(',')}
                className="hidden"
                onChange={(e) => {
                  handleFileChosen(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <LibraryGrid entityType={entityType} mediaType={mediaType} onSelect={handleLibrarySelect} />
          )}
        </div>
      </Modal>
    </div>
  );
}
