import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/global/PageContainer';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { EmptyState } from '@/components/global/EmptyState';
import { Spinner } from '@/components/global/Loading';
import { useHelpCategories, useHelpArticles } from '@/features/help/helpApi';

export default function HelpCategoryPage() {
  const { category } = useParams();
  const { data: categories = [] } = useHelpCategories();
  const { data, isLoading } = useHelpArticles({ category, limit: 50 });

  const categoryLabel = categories.find((c) => c.value === category)?.label ?? category;
  const articles = data?.items ?? [];

  return (
    <PageContainer top="sm" bottom="md" className="max-w-3xl">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Help Center', to: '/help' }, { label: categoryLabel }]} />

      <h1 className="mt-6 font-display text-h3 font-bold text-heading">{categoryLabel}</h1>

      {isLoading ? (
        <Spinner className="mx-auto mt-10" />
      ) : articles.length === 0 ? (
        <EmptyState title="No articles in this category yet" description="Check back soon, or contact support for direct help." className="mt-10" />
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-border rounded-xl ring-1 ring-border">
          {articles.map((article) => (
            <Link key={article.id} to={`/help/${article.slug}`} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
              <div>
                <p className="text-sm font-medium text-heading">{article.title}</p>
                {article.summary && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{article.summary}</p>}
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
