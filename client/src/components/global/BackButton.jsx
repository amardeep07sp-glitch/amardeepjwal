import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// One global back-navigation control, used identically on desktop and
// mobile everywhere a page is reached by drilling in (product detail,
// listing, collection pages) - never on the Homepage, which is the root.
// `navigate(-1)` only makes sense when this tab actually has in-app history
// to go back to; landing here directly (an external link, a shared URL, a
// hard refresh) has no such history, so it falls back to a safe path
// instead of navigating the visitor out of the site entirely.
export function BackButton({ fallbackPath = '/', label = 'Back', className }) {
  const navigate = useNavigate();

  const handleClick = () => {
    const hasInAppHistory = (window.history.state?.idx ?? 0) > 0;
    if (hasInAppHistory) navigate(-1);
    else navigate(fallbackPath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary/50 py-1.5 pr-3 pl-2.5 text-sm font-medium text-muted-foreground ring-1 ring-border/50 transition-all duration-300 hover:bg-secondary hover:text-foreground hover:shadow-sm cursor-pointer',
        className
      )}
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </button>
  );
}
