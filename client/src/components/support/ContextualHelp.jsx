import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { HelpDrawer } from './HelpDrawer';

// The main "Get Help" trigger (Phase 5) - each call site passes the ONE
// article slug that's actually relevant there ("How is jewellery pricing
// calculated?" on the product page, "How is my final amount calculated?"
// at checkout) - never a generic help button that dumps the customer into
// a search page. That's the whole "understand context" requirement: the
// caller already knows what's relevant, this component just renders the
// trigger + drawer consistently everywhere it's used.
export function ContextualHelp({ slug, label, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline ${className}`}
      >
        <CircleHelp className="size-3.5" />
        {label}
      </button>
      <HelpDrawer open={open} onOpenChange={setOpen} slug={slug} />
    </>
  );
}
