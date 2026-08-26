import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public, unauthenticated - a published CMS page (Admin -> CMS -> Pages) by
// its slug. Never resolves a draft - page.repository.js#findPublishedBySlug
// filters status on the backend, not here.
export const usePublicPage = (slug) =>
  useQuery({
    queryKey: ['storefront', 'pages', slug],
    queryFn: async () => (await api.get(`/pages/public/${slug}`)).data,
    enabled: Boolean(slug),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
