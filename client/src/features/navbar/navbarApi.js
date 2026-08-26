import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Public, unauthenticated - active custom navbar items an admin has added
// (Admin -> CMS -> Navbar), on top of the real category strip. A 'page'
// type item resolves to /pages/:slug (see CmsPage.jsx); a 'custom_link'
// item resolves to its own real url (SmartLink picks internal vs external).
export const usePublicNavbarItems = () =>
  useQuery({
    queryKey: ['storefront', 'navbar'],
    queryFn: async () => (await api.get('/navbar/public')).data,
    staleTime: 5 * 60 * 1000,
    select: (items) =>
      items
        .map((item) => ({
          id: item._id ?? item.id,
          label: item.label,
          openInNewTab: item.openInNewTab,
          path: item.page ? `/pages/${item.page.slug}` : item.url,
        }))
        .filter((item) => item.path),
  });
