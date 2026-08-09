import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// DialogContent caps itself at max-h-[85vh] and is a flex column (see
// ui/dialog.jsx) - the "min-h-0" below is what lets this middle section
// actually shrink and scroll within that cap instead of pushing the dialog
// taller than the viewport (a classic flexbox min-height:auto trap). This is
// what keeps every modal's header and footer visible and reachable on a
// short mobile screen, regardless of how long the form inside it is.
export function Modal({ open, onOpenChange, title, description, footer, children, className }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
