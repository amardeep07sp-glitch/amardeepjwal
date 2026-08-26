import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { PageContainer } from '@/components/global/PageContainer';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { Spinner } from '@/components/global/Loading';
import { Button } from '@/components/ui/button';
import { useHelpArticle, useVoteHelpArticleHelpful } from '@/features/help/helpApi';

export default function HelpArticlePage() {
  const { slug } = useParams();
  const { data: article, isLoading, isError } = useHelpArticle(slug);
  const voteHelpful = useVoteHelpArticleHelpful();
  const [voted, setVoted] = useState(false);

  const handleVote = (helpful) => {
    if (voted) return;
    voteHelpful.mutate({ slug, helpful });
    setVoted(true);
  };

  if (isLoading) {
    return (
      <PageContainer top="sm" bottom="md">
        <Spinner className="mx-auto mt-20" />
      </PageContainer>
    );
  }

  if (isError || !article) return <Navigate to="/help" replace />;

  return (
    <PageContainer top="sm" bottom="md" className="max-w-3xl">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Help Center', to: '/help' }, { label: article.title }]} />

      <article className="mt-6">
        <h1 className="font-display text-h3 font-bold text-heading">{article.title}</h1>
        {article.summary && <p className="mt-2 text-muted-foreground">{article.summary}</p>}
        <div className="mt-6 text-sm whitespace-pre-wrap text-foreground/90">{article.content}</div>

        {article.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          {voted ? (
            <span>Thanks for your feedback!</span>
          ) : (
            <>
              Was this article helpful?
              <Button variant="outline" size="sm" onClick={() => handleVote(true)}>
                <ThumbsUp className="size-3.5" /> Yes
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleVote(false)}>
                <ThumbsDown className="size-3.5" /> No
              </Button>
            </>
          )}
        </div>

        <div className="mt-6">
          <Link to="/support" className="text-sm font-medium text-primary hover:underline">
            Still need help? Contact Support &rarr;
          </Link>
        </div>
      </article>
    </PageContainer>
  );
}
