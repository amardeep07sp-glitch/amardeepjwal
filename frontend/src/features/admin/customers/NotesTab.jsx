import { useState } from 'react';
import { Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/global/EmptyState';
import { useNotes, useCreateNote, useDeleteNote } from './customerNotesApi';

export function NotesTab({ customerId }) {
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const { data: notes } = useNotes(customerId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const handleAdd = async () => {
    if (!content.trim()) {
      toast.error('Note content is required');
      return;
    }
    try {
      await createNote.mutateAsync({ customerId, content: content.trim(), isPrivate });
      setContent('');
      setIsPrivate(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote.mutateAsync(id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <Textarea rows={3} placeholder="Add an internal note..." value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={isPrivate} onCheckedChange={setIsPrivate} /> Private note
          </label>
          <Button size="sm" onClick={handleAdd} disabled={createNote.isPending}>
            {createNote.isPending ? 'Adding...' : 'Add note'}
          </Button>
        </div>
      </div>

      {!notes || notes.length === 0 ? (
        <EmptyState title="No notes yet" description="Internal notes about this customer will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  {note.isPinned && <Pin className="size-3.5 text-primary" />}
                  {note.isPrivate && <Badge variant="secondary">Private</Badge>}
                </div>
                <p className="mt-1">{note.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.createdBy?.name ?? 'System'} · {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Delete note" onClick={() => handleDelete(note.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
