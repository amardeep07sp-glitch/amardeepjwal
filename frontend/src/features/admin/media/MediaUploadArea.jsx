import { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useUploadMedia } from './mediaApi';

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export function MediaUploadArea({ entityType, entityId, variantId, disabled }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadMedia = useUploadMedia(entityType, entityId, variantId);

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList).filter((file) => ACCEPTED_MIME_TYPES.includes(file.type));
    const rejected = fileList.length - files.length;
    if (rejected > 0) {
      toast.error(`${rejected} file(s) skipped - unsupported format`);
    }

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      if (variantId) formData.append('variantId', variantId);

      try {
        await uploadMedia.mutateAsync(formData);
        toast.success(`Uploaded "${file.name}"`);
      } catch (err) {
        toast.error(`"${file.name}" failed: ${err.message}`);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border p-8 text-center transition-colors',
        !disabled && 'cursor-pointer hover:border-primary hover:bg-primary/5',
        isDragging && 'border-primary bg-primary/10',
        disabled && 'opacity-50'
      )}
    >
      {uploadMedia.isPending ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : (
        <UploadCloud className="size-6 text-muted-foreground" />
      )}

      <p className="text-sm font-medium">
        {uploadMedia.isPending ? 'Uploading...' : 'Drag & drop files here, or click to browse'}
      </p>
      <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP, AVIF, MP4, WEBM, MOV</p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_MIME_TYPES.join(',')}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
