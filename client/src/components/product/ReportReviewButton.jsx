import { useState } from 'react';
import { Flag, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReportReview } from '@/features/storefront/storefrontApi';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'fake_review', label: 'Fake review' },
  { value: 'offensive', label: 'Offensive content' },
  { value: 'irrelevant', label: 'Irrelevant to this product' },
  { value: 'misleading', label: 'Misleading' },
  { value: 'personal_information', label: 'Contains personal information' },
  { value: 'other', label: 'Other' },
];

// Deliberately its own small component, not the general
// <ReportProblemButton /> - review reports go straight to Review
// Moderation (storefront.routes.js's /reviews/:reviewId/report), never
// through the general issue-reporting pipeline (Phase 18's explicit rule).
export function ReportReviewButton({ reviewId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const reportReview = useReportReview();

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) {
      setReason('');
      setDescription('');
      setSubmitted(false);
      reportReview.reset();
    }
  };

  const handleSubmit = async () => {
    if (!reason) return;
    try {
      await reportReview.mutateAsync({ reviewId, payload: { reason, description: description.trim() || undefined } });
      setSubmitted(true);
    } catch {
      // error surfaced via reportReview.error below
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
      >
        <Flag className="size-3" /> Report
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-10 text-success" />
              <p className="text-sm font-medium text-heading">Thanks for letting us know</p>
              <p className="text-sm text-muted-foreground">Our team will review this.</p>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Report this review</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-heading">Reason</label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-heading">Additional details (optional)</label>
                  <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                {reportReview.isError && <p className="text-xs font-medium text-destructive">{reportReview.error.message}</p>}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={!reason} loading={reportReview.isPending}>
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
