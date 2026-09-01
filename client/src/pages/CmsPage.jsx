import { useParams } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { usePublicPage } from '@/features/pages/pagesApi';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { EmptyState } from '@/components/global/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeo } from '@/hooks/useSeo';
import { APP_NAME, SITE_URL } from '@/config/appConfig';

// The one destination every admin-created CMS page (Admin -> CMS -> Pages)
// actually renders at - `content` is a plain Textarea field on the admin
// form (page.model.js has no rich-text/HTML field), so it's rendered as
// preformatted text, not dangerouslySetInnerHTML.
export default function CmsPage() {
  const { slug } = useParams();
  const { data: page, isLoading, isError } = usePublicPage(slug);

  useSeo({
    title: page ? `${page.title} | ${APP_NAME}` : undefined,
    description: page?.content ? `${page.content.slice(0, 155).trim()}...` : undefined,
    canonical: slug ? `${SITE_URL}/pages/${slug}` : undefined,
  });

  return (
    <PageContainer top="md" bottom="md">
      <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: page?.title ?? 'Page' }]} />
      </div>

      <div className="mx-auto max-w-3xl">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : isError || !page ? (
          <EmptyState icon={FileQuestion} title="Page not found" description="This page doesn't exist or isn't published yet." />
        ) : (
          <>
            <h1 className="mb-4 text-h3 font-display font-bold text-heading sm:text-h2">{page.title}</h1>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">{page.content}</p>
          </>
        )}
      </div>
    </PageContainer>
  );
}
