import { Link } from 'react-router-dom';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useHelpArticle, useVoteHelpArticleHelpful } from '@/features/help/helpApi';
import { useState } from 'react';

// The slide-in panel ContextualHelp.jsx opens - shows a single article's
// full content without leaving the current page (Phase 5's whole point:
// the answer to "How is my final amount calculated?" appears right there
// at checkout, not on a separate page the customer has to navigate to and
// lose their place).
export function HelpDrawer({ open, onOpenChange, slug }) {
  const { data: article, isLoading } = useHelpArticle(slug, { enabled: open && Boolean(slug) });
  const voteHelpful = useVoteHelpArticleHelpful();
  const [voted, setVoted] = useState(false);

  const handleVote = (helpful) => {
    if (voted || !slug) return;
    voteHelpful.mutate({ slug, helpful });
    setVoted(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>{article?.title ?? 'Help'}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !article ? (
            <p className="text-sm text-muted-foreground">This article isn't available right now.</p>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{article.content}</p>
              <Link to={`/help/${article.slug}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                View full article <ArrowRight className="size-3.5" />
              </Link>
              <div className="flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                {voted ? (
                  <span>Thanks for your feedback!</span>
                ) : (
                  <>
                    Was this helpful?
                    <button type="button" onClick={() => handleVote(true)} className="rounded-full p-1.5 hover:bg-muted">
                      <ThumbsUp className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => handleVote(false)} className="rounded-full p-1.5 hover:bg-muted">
                      <ThumbsDown className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
