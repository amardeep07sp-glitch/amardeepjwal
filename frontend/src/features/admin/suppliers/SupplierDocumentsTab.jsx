import { useRef, useState } from 'react';
import { FileText, Trash2, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/global/EmptyState';
import { useMedia, useUploadMedia, useDeleteMedia } from '../media/mediaApi';

// Supplier documents (GST certificate, PAN, bank proof, rate contracts)
// reuse the Media Engine exactly - entityType 'supplier', same
// document-category-in-caption convention as customer/DocumentsTab.jsx.
const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function SupplierDocumentsTab({ supplierId }) {
  const inputRef = useRef(null);
  const [category, setCategory] = useState('GST Certificate');
  const { data, isLoading } = useMedia('supplier', supplierId, null);
  const uploadMedia = useUploadMedia('supplier', supplierId, null);
  const deleteMedia = useDeleteMedia('supplier', supplierId, null);

  const documents = data?.items ?? [];

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error('Only PDF, JPEG, PNG, or WEBP files are accepted');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'supplier');
    formData.append('entityId', supplierId);
    formData.append('caption', category);

    try {
      await uploadMedia.mutateAsync(formData);
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMedia.mutateAsync({ id });
      toast.success('Document deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. GST Certificate, Rate Contract)"
          className="w-64"
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploadMedia.isPending}>
          {uploadMedia.isPending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          Upload document
        </Button>
        <input ref={inputRef} type="file" accept={ACCEPTED_MIME_TYPES.join(',')} className="hidden" onChange={handleFileSelected} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      ) : documents.length === 0 ? (
        <EmptyState title="No documents yet" description="Upload GST certificate, PAN, bank proof, or rate contracts here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <a href={doc.cloudinary?.secureUrl ?? doc.secureUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                <FileText className="size-4 text-muted-foreground" />
                {doc.caption || 'Document'}
              </a>
              <Button variant="ghost" size="icon-sm" aria-label="Delete document" onClick={() => handleDelete(doc.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
