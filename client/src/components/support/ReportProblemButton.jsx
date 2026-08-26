import { useState } from 'react';
import { Flag, Paperclip, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMyIssue } from '@/features/support/supportApi';
import { compressImage } from '@/lib/compressImage';
import { ISSUE_REASONS_BY_CATEGORY } from '@/features/support/issueReasons';

// The reusable "Report a problem" entry point (Phase 51/53) - every call
// site passes its own real, already-known context (productId, orderId,
// couponId, cartId...) via `entityType`/`entityId`/`context` so the
// customer only ever picks a reason and adds a description - never
// re-types information the app already has.
export function ReportProblemButton({
  category,
  entityType,
  entityId,
  context = {},
  triggerLabel = 'Report a problem',
  variant = 'ghost',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [submittedIssue, setSubmittedIssue] = useState(null);
  const createIssue = useCreateMyIssue();

  const reasons = ISSUE_REASONS_BY_CATEGORY[category] ?? ISSUE_REASONS_BY_CATEGORY.other;

  const resetForm = () => {
    setReason('');
    setDescription('');
    setFiles([]);
    setSubmitError('');
    setSubmittedIssue(null);
  };

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleSubmit = async () => {
    if (!reason || !description.trim()) return;
    setSubmitError('');
    const formData = new FormData();
    formData.append('category', category);
    formData.append('subCategory', reason);
    if (entityType) formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);
    formData.append('description', description.trim());
    formData.append('metadata', JSON.stringify(context));
    const compressedFiles = await Promise.all(files.map(compressImage));
    compressedFiles.forEach((file) => formData.append('attachments', file));

    try {
      const result = await createIssue.mutateAsync(formData);
      setSubmittedIssue(result);
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <>
      <Button type="button" variant={variant} size="sm" className={className} onClick={() => setOpen(true)}>
        <Flag className="size-3.5" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          {submittedIssue ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-10 text-success" />
              <p className="text-sm font-medium text-heading">Thanks - we've logged this as {submittedIssue.issueNumber}</p>
              <p className="text-sm text-muted-foreground">Our team will review it and follow up if needed.</p>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{triggerLabel}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-heading">What's wrong?</label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasons.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-heading">Tell us more</label>
                  <Textarea rows={3} placeholder="Describe what happened..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Paperclip className="size-3.5" />
                  {files.length > 0 ? `${files.length} file(s) attached` : 'Attach a photo (optional)'}
                  <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                </label>

                {submitError && <p className="text-xs font-medium text-destructive">{submitError}</p>}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={!reason || !description.trim()} loading={createIssue.isPending}>
                  Submit report
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
