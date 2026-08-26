import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// A plain, consistently-styled link to a full Help Center article (Phase
// 5) - for when the answer deserves a real page, not just a one-line
// tooltip (see HelpTooltip.jsx for that shorter case).
export function HelpArticleLink({ slug, children, className = '' }) {
  return (
    <Link to={`/help/${slug}`} className={`inline-flex items-center gap-1 text-sm text-primary hover:underline ${className}`}>
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}
