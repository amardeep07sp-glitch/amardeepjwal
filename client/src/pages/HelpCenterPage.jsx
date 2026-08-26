import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, LifeBuoy } from 'lucide-react';
import { PageContainer } from '@/components/global/PageContainer';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { EmptyState } from '@/components/global/EmptyState';
import { Spinner } from '@/components/global/Loading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useHelpCategories, useFeaturedHelpArticles, useHelpSearch } from '@/features/help/helpApi';

// The real Help Center (Phase 3) - CMS-driven categories/articles,
// replacing the old hardcoded FaqsPage. Search happens right on this page
// (no separate results page) so a customer never loses the category
// browse context they started from.
export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const { data: categories = [], isLoading: categoriesLoading } = useHelpCategories();
  const { data: featured } = useFeaturedHelpArticles(6);
  const { data: searchResults, isLoading: searchLoading } = useHelpSearch(search);

  const isSearching = search.trim().length > 0;

  return (
    <PageContainer top="sm" bottom="md">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Help Center' }]} />

      <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="font-display text-h2 font-bold text-heading">How can we help?</h1>
        <p className="text-muted-foreground">Search our Help Center or browse by topic below.</p>
        <div className="relative w-full max-w-lg">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-10 text-base"
            placeholder="Search for help, e.g. 'making charges'"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link to="/support" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <LifeBuoy className="size-4" />
          Need more help? Contact Support
        </Link>
      </div>

      {isSearching ? (
        <div className="mx-auto mt-10 max-w-2xl">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Search results</h2>
          {searchLoading ? (
            <Spinner className="mx-auto" />
          ) : searchResults?.items?.length ? (
            <div className="flex flex-col divide-y divide-border rounded-xl ring-1 ring-border">
              {searchResults.items.map((article) => (
                <Link key={article.id} to={`/help/${article.slug}`} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-heading">{article.title}</p>
                    {article.summary && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{article.summary}</p>}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No articles found" description="Try a different search term, or contact support for direct help." />
          )}
        </div>
      ) : (
        <>
          {featured?.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 text-h5 font-semibold text-heading">Popular articles</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((article) => (
                  <Link key={article.id} to={`/help/${article.slug}`} className="rounded-xl bg-card p-4 ring-1 ring-border transition-colors hover:ring-primary/40">
                    <p className="text-sm font-medium text-heading">{article.title}</p>
                    {article.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article.summary}</p>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12">
            <h2 className="mb-4 text-h5 font-semibold text-heading">Browse by topic</h2>
            {categoriesLoading ? (
              <Spinner className="mx-auto" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {categories.map((cat) => (
                  <Link
                    key={cat.value}
                    to={`/help/category/${cat.value}`}
                    className="flex flex-col gap-1 rounded-xl bg-card p-4 ring-1 ring-border transition-colors hover:ring-primary/40"
                  >
                    <span className="text-sm font-medium text-heading">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">{cat.articleCount} article{cat.articleCount === 1 ? '' : 's'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl bg-muted/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">Still didn't find what you're looking for?</p>
        <Button asChild>
          <Link to="/support">Contact Support</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
