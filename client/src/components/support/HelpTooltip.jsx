import { HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

// A short, static inline explanation (Phase 5) - "How is my final amount
// calculated?" next to a price line, "Why isn't this coupon applicable?"
// next to a coupon field. Click-to-open (a Dialog, not a hover tooltip) is
// deliberate - hover tooltips don't work on a touchscreen, and this whole
// system has to be mobile-friendly first (Phase 52).
export function HelpTooltip({ label, text, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label || 'Help'}
        className={`inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/70 hover:text-primary ${className}`}
      >
        <HelpCircle className="size-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{label || 'Help'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{text}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
